'use strict';

const fs = require('fs').promises;
const path = require('path');
const paths = require('../util/pathHandler');
const readline = require('readline');
const { google } = require('googleapis');
const { get, setWith } = require('lodash');
const tools = require('../db/tools');

const productTable = {
  '24 sata': {
    client: '24h',
    defaults: { country: 'HR', client_group: 'interni', client: '24h', product_group: '24h' },
    unmatched: '24 New graphics',
    deskCheck: true,
  },
  'Večernji list': {
    client: 'VL',
    defaults: { country: 'HR', client_group: 'interni', client: 'VL', product_group: 'VL' },
    unmatched: 'New Graphics VL',
    deskCheck: true,
  },
  Administracija: {
    client: 'administracija',
  },
  Austrija: {},
  Asura: {},
  'Red Point': {},
};

function resolveAdministration(table) {
  const check = {
    '24h': {
      '24 Posebni proizvodi - knjige': [/tihana/i, /knjig./i],
      '24 Budi.IN': [/budi.in/i],
      '24 Express': [/express/i],
      '24 Autostart': [/autostart/i],
      '24 Sport': [/sport/i],
      '24 Bingo': [/bingo/i],
      Njuškalo: [/nju.kalo/i],
    },
    VL: {
      Enigmatika: [/enigmati./i],
      Njuškalo: [/nju.kalo/i],
      'Obzor VL': [/obzor/i],
      'Posebni prilozi VL': [/knjiga/i, /oleg/i, /birman/i],
      Oglasi: [/vesn[au]/i, /mladen/i, /raznon?/i, /marketing/],
      'Max VL': [/max/i],
      'Radost VL': [/radost/i],
      'Panorama VL': [/panorama/i],
      'Nedjelja VL': [/nedjelj[au]/i],
      Parte: [/part[eau]/i],
    },
  };

  if (!check[table.client]) throw new Error(`Unknown client "${table.client}" in resolveAdministration()!`);

  let matched = false;
  for (const product in check[table.client]) {
    if (matched) break;
    for (const regex of check[table.client][product]) {
      if (regex.test(string)) matched = product;
      if (matched) break;
    }
  }

  if (table.client === '24h' && matched === 'Njuškalo')
    return { ...productTable['Večernji list'].defaults, product: matched };
  return { ...table.defaults, product: matched || table.unmatched };
}

function handleAmount(o) {
  let output = 0;
  if (o.n === '') {
    if (o.t1) {
      if (o.t1 === '' && o.n1 !== '') output = Number(o.n1);
    } else if (o.t2) {
      if (o.t2 === '' && o.n2 !== '') output = Number(o.n2);
    }
  } else {
    output = Number(o.n);
  }
  if (isNaN(output)) throw new Error(`handleAmount was unable to resolve amount: ${JSON.stringify(o)}`);
  if (!output) return 1;
  return output;
}

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(paths.db, 'token.json');

async function mainParser(meta, db) {
  let content, result;
  console.log(`[${new Date().toTimeString().split(' ')[0]}] [Admin] Connecting to google sheets...`);

  async function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    let token;
    try {
      token = await fs.readFile(TOKEN_PATH);
    } catch (err) {
      return getNewToken(oAuth2Client, callback);
    }
    await oAuth2Client.setCredentials(JSON.parse(token));
    return await callback(oAuth2Client);
  }
  function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error while trying to retrieve access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }

  async function getAdmin(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    let doner = [];
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1yljwJAv9L0IjI5vKTkRWtN4ahvFctwFCWcFWRJICoBg',
        range: 'Odgovori iz obrasca 1!A3:M',
      });
      const rows = res.data.values;
      if (rows.length) {
        // [
        //   [0]  'vremenska'  '18.5.2017. 15:59:54',
        //   [1]  'ime'        'Karlo Toth',
        //   [2]  'datum'      '18.5.2017.',
        //   [3]  'klijent'    '24 sata',
        //   [4]  'desk'       '',
        //   [5]  'proizvod'   'Budi IN CHIC',
        //   [6]  'sn'         '8',
        //   [7]  'st'         '4:20:00',
        //   [8]  'cn'         '',
        //   [9]  'ct'         '',
        //  [10]  'on'         '',
        //  [11]  'ot'         '',
        //  [12]  'opis'       'BUDI IN EDITORIAL CHIC'
        // ]
        const columns = [
          'vremenska',
          'ime',
          'datum',
          'klijent',
          'desk',
          'proizvod',
          'sn',
          'st',
          'cn',
          'ct',
          'on',
          'ot',
          'opis',
        ];
        const datePattern = /(?<d>\d+)\.(?<m>\d+)\.(?<y>\d+)\./;
        const durationPattern = /(?<h>\d+)\:(?<m>\d+)\:(?<s>\d+)/;

        const output = {};
        for (const row of rows) {
          if (!datePattern.test(row[2])) console.log(row[2]);
          const dateRaw = datePattern.exec(row[2]);
          const date = new Date(dateRaw.groups.y, dateRaw.groups.m, dateRaw.groups.d).getTime();
          const day = tools.handleDay(date, meta, db);

          const user = meta.users.admin[row[1]];
          if (!user) throw new Error(`What do you mean, there's no user ${row[1]} in meta.users.admin?`);

          if (!row[3] || row[3] === '') throw new Error("What do you mean, there's no row[3] (klijent)?");
          if (!row[5] || row[5] === '') throw new Error("What do you mean, there's no row[5] (proizvod)?");
          if (!productTable[row[3]]) throw new Error(`What do you mean, there's no productTable[${row[3]}]?`);
          let productRaw = { ...productTable[row[3]], client: row[3], desk: row[4], product: row[5] };
          const product = resolveAdministration(productRaw);

          const typeRaw = { standard: false, cutout: false, other: false };
          if (durationPattern.test(row[7])) {
            let dRaw = durationPattern.exec(row[7]);
            let duration = Number(dRaw.groups.h) * 36e5 + Number(dRaw.groups.m) * 6e4 + Number(dRaw.groups.s) * 1e3;
            let amount = handleAmount({ n: row[6], t1: row[9], n1: row[8], t2: row[11], n2: row[10] });
            typeRaw.standard = { duration, amount };
          }
          if (durationPattern.test(row[9])) {
            let dRaw = durationPattern.exec(row[9]);
            let duration = Number(dRaw.groups.h) * 36e5 + Number(dRaw.groups.m) * 6e4 + Number(dRaw.groups.s) * 1e3;
            let amount = handleAmount({ n: row[9], t1: row[7], n1: row[6], t2: row[11], n2: row[10] });
            typeRaw.cutout = { duration, amount };
          }
          if (durationPattern.test(row[11])) {
            let dRaw = durationPattern.exec(row[11]);
            let duration = Number(dRaw.groups.h) * 36e5 + Number(dRaw.groups.m) * 6e4 + Number(dRaw.groups.s) * 1e3;
            let amount = handleAmount({ n: row[11], t1: row[7], n1: row[6], t2: row[9], n2: row[8] });
            typeRaw.other = { duration, amount };
          }

          for (const t in typeRaw) {
            if (typeRaw[t]) {
            }
          }

          // const typeRaw = {
          //   standard: {
          //     amount: 0,
          //     duration: 0
          //   },
          //   cutout:
          // }

          // day -> product -> user -> type
          console.log({ day, product, user, type });
          // setWith(output, `[${day}][${product}][${user}][${type}]`, )
          // const exists = get(output, `[${day}][${product}][${user}][${type}]`, false);

          // if (!exists) setWith(output, `["${klijent}"]["${desk}"]`, new Set(), Object);
          // output[klijent][desk].add(proizvod);
        }
        // console.log(JSON.stringify(unique, null, 3));
        return;
        function Set_toJSON(key, value) {
          if (typeof value === 'object' && value instanceof Set) {
            return [...value];
          }
          return value;
        }

        await fs.writeFile(path.join(paths.db, 'administracija.json'), JSON.stringify(unique, Set_toJSON, 6), 'utf-8');
        return true;
        rows.map((row) => {
          // console.log(`${row[0]}, ${row[4]}`);
          let tmpObj = {};
          console.log(row);
          row.map((item, i) => {
            if (item.length > 0) {
              if (i == 0) {
                let datetime = item.split(' ', 2);
                let date = datetime[0].split('.', 3);
                let time = datetime[1].split(':', 3);
                item = new Date(
                  Number(date[2]),
                  Number(date[1]) - 1,
                  Number(date[0]),
                  Number(time[0]),
                  Number(time[1]),
                  Number(time[2])
                );
              } else if (i == 1) {
                if (getKey(userNames, item)) item = getKey(userNames, item);
              } else if (i == 2) {
                let date = item.split('.', 3);
                item = parseInt('' + pad(Number(date[2]), 4) + pad(Number(date[1]), 2) + pad(Number(date[0]), 2));
              } else if (i == 3) {
                if (item == '24 sata') item = '24h';
                if (item == 'Večernji list') item = 'VL';
                if (item == 'Poslovni dnevnik') item = 'PD';
              } else if (i == 6 || i == 8 || i == 10) {
                item = Number(item);
              } else if (i == 7 || i == 9 || i == 11) {
                let time = item.split(':', 3);
                item = Number(time[0]) * 60 * 60 + Number(time[1]) * 60 + Number(time[2]);
              }
              tmpObj[columns[i]] = item;
            }
          });

          if (typeof tmpObj.sn == 'number' || typeof tmpObj.st == 'number') {
            let tmpObjStd = {
              date: tmpObj.datum,
              type: 'Standard',
              user: tmpObj.ime,
              source: 'Administracija',
              client: tmpObj.klijent,
              product: tmpObj.proizvod,
              zone: 'HR',
            };
            tmpObjStd.amount = tmpObj.sn ? tmpObj.sn : 0;
            tmpObjStd.duration = tmpObj.st ? tmpObj.st : 0;
            if (tmpObj.desk) tmpObjStd.desk = tmpObj.desk;
            if (tmpObj.opis) tmpObjStd.comment = tmpObj.opis;
            doner.push(tmpObjStd);
            br1 += 1;
          }
          if (typeof tmpObj.cn == 'number' || typeof tmpObj.ct == 'number') {
            let tmpObjCut = {
              date: tmpObj.datum,
              type: 'Cutout',
              user: tmpObj.ime,
              source: 'Administracija',
              client: tmpObj.klijent,
              product: tmpObj.proizvod,
              zone: 'HR',
            };
            tmpObjCut.amount = tmpObj.cn ? tmpObj.cn : 0;
            tmpObjCut.duration = tmpObj.ct ? tmpObj.ct : 0;
            if (tmpObj.desk) tmpObjCut.desk = tmpObj.desk;
            if (tmpObj.opis) tmpObjCut.comment = tmpObj.opis;
            doner.push(tmpObjCut);
            br2 += 1;
          }
          if (typeof tmpObj.on == 'number' || typeof tmpObj.ot == 'number') {
            let tmpObjOst = {
              date: tmpObj.datum,
              type: 'Razno',
              user: tmpObj.ime,
              source: 'Administracija',
              client: tmpObj.klijent,
              product: tmpObj.proizvod,
              zone: 'HR',
            };
            tmpObjOst.amount = tmpObj.on ? tmpObj.on : 0;
            tmpObjOst.duration = tmpObj.ot ? tmpObj.ot : 0;
            if (tmpObj.desk) tmpObjOst.desk = tmpObj.desk;
            if (tmpObj.opis) tmpObjOst.comment = tmpObj.opis;
            doner.push(tmpObjOst);
            br3 += 1;
          }
        });
        // console.log('doner:', doner.length);
        // console.log('rows:', rows.length);
        // console.log('br1:', br1, 'br2:', br2, 'br3:', br3, 'sum:', br1 + br2 + br3);
      } else {
        console.log('No data found.');
      }
    } catch (err) {
      console.log('The API returned an error:', err);
    }
    return doner;
  }

  try {
    content = await fs.readFile(path.join(paths.db, 'credentials.json'));
  } catch (err) {
    return console.log('Error loading client secret file:', err);
  }

  try {
    result = await authorize(JSON.parse(content), getAdmin);
  } catch (err) {
    console.log('Ovdje ne bi trebalo doć do errora.');
  }

  console.log(`[${new Date().toTimeString().split(' ')[0]}] [Admin] Output ready, returning.`);
  return result;
}

module.exports = mainParser;
// mainParser().then(console.log);
