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
    id: '24 sata',
    client: '24h',
    defaults: { country: 'HR', client_group: 'interni', client: '24h', product_group: '24h' },
    unmatched: '24 New graphics',
    useDesk: true,
    types: { standard: 'standard', cutout: 'cutout', other: 'montage' },
    check: {
      '24 Posebni proizvodi - knjige': [/tihana/i, /knjig./i],
      '24 Budi.IN': [/budi.in/i],
      '24 Express': [/express/i],
      '24 Autostart': [/autostart/i],
      '24 Sport': [/sport/i],
      '24 Bingo': [/bingo/i],
      Njuškalo: [/nju.kalo/i],
    },
  },
  'Večernji list': {
    id: 'Večernji list',
    client: 'VL',
    defaults: { country: 'HR', client_group: 'interni', client: 'VL', product_group: 'VL' },
    unmatched: 'New Graphics VL',
    useDesk: true,
    types: { standard: 'standard', cutout: 'cutout', other: 'montage' },
    check: {
      Enigmatika: [/enigmati./i],
      Njuškalo: [/nju.kalo/i],
      'Unutrasnja VL': [/barbara/i],
      'Obzor VL': [/obzor/i],
      'Max VL': [/max/i],
      'Radost VL': [/radost/i],
      'Panorama VL': [/panorama/i],
      'Nedjelja VL': [/nedjelj[au]/i],
      Parte: [/part[eau]/i],
      'Posebni prilozi VL': [/knjiga/i, /oleg/i, /birman/i],
      Oglasi: [/vesn[au]/i, /mladen/i, /raznon?/i, /marketing/],
    },
  },
  Administracija: {
    id: 'Administracija',
    client: 'Administracija',
    defaults: { country: 'HR', client_group: 'interni', client: 'Administracija', product_group: 'Razno' },
    unmatched: 'Ostalo',
    useDesk: false,
    useGroup: true,
    types: { standard: 'var', cutout: 'var', other: 'var' },
    check: {
      Razvoj: {
        Web: [/ogla?s?n?[ae]? plo.[ae]/i, /digitalna plo.a/i, /web plo.a/i, /web str/i, /priprema materijala za web/i],
        Excel: [/excel/i],
        Photoshop: [/sample map/i, /akcija/i],
        Programiranje: [
          /app/i,
          /folder.?monitor/i,
          /folderwatchnotify/i,
          /compiley/i,
          /panel/i,
          /mongodb/i,
          /vue/i,
          /jsx/i,
          /code/i,
          /debug/i,
          /scripting/i,
          /skript/i,
        ],
      },
      Edukacija: {
        Trening: [/trening/i, /vje[zž]ba/i, /edukacija/i, /tutorial/i, /video/i, /youtube/i, /školica/i, /dokumentac/i],
        Workshop: [/radionica/i, /predavanje/i],
      },
      Sastanak: {
        Priprema: [/priprema za aus/i],
        Eksterni: [/sastanak.+(?:adria|barbir)/i, /sits sastanak/i, /meeting/i],
        Interni: [
          /godi[šs]nji/i,
          /sastanak/i,
          /sastanci/i,
          /sasat/i,
          /ssatanak/i,
          /susret/i,
          /razgovor/i,
          /brainstorming/i,
          /marianne/i,
        ],
      },
      Održavanje: {
        Amendo: [/amend[ou]/i],
        Asura: [/asur[ae]/i, /analiza/i, /sobo.ke/i, /tom+y/i, /provjer/i, /CTP/],
        Claro: [/claro/i, /elpical/i, /priprema.+clar/i],
        Elvis: [/elvis/i],
        DTI: [/dti/i],
        Kompjuteri: [
          /adobe/i,
          /kom[op]/i,
          /instal/i,
          /outlook/i,
          /driver/i,
          /sastavljanje/i,
          /sređivanje/i,
          /premi?ještanje/i,
          /scanner/i,
          /microsoft/i,
          /IT/,
          /setupiranje/i,
          /internet/i,
          /shareovi/i,
        ],
        Monitori: [/kalibracij/i],
        Čišćenje: [/aparat/i],
        'Organizacija rada': [/organizacija (?:posla|rada)/i, /koordinacija/i],
        Aplikacije: [/trello/i, /slack/i, /skype/i],
      },
      Marketing: {
        Layout: [
          /indesign/i,
          /il+ustrator/i,
          /čestitka/i,
          /dizajn/i,
          /prezentacijsk/i,
          /uput/i,
          /kišobran/i,
          /layout/i,
          /nacrti/i,
        ],
        Slike: [/obrada slike/i],
      },
      Austrija: {
        Pamela: [/pamela/i, /skillsplatform/i],
        Wien: [
          /wien/i,
          /active beauty/i,
          /beč/i,
          /diva/i,
          /rapid/i,
          /sport ?magazin/i,
          /sportaktiv/i,
          /tortenmag/i,
          /miss/i,
          /klipp/i,
        ],
        Graz: [/graz/i, /diepresse/i, /austrija/i, /monat/i, /styria media/i],
      },
      Razno: {
        Inteko: [/inteko/i],
        Konzum: [/konzum/i],
        Pošta: [/pošta/i],
        SanMet: [/san.?met/i],
        Start: [/start/i],
        TIZG: [/tizg/i],
        Emmezeta: [/em+ez+et+a/i],
        Administracija: [
          /unos admin/i,
          /ured/i,
          /easy ?job/i,
          /e.?mail/i,
          /adm[in][nsi]/i,
          /as?ministra/i,
          /dminis/i,
          /Mail/,
          /nabavka/i,
        ],
        Praksa: [/student/i],
        Sistematski: [/sistematski/i, /medikol/i],
        Adriamedia: [/adriamed/i],
        BudiIn: [/budi.in/i],
        Njuškalo: [/nju[šs]kalo/i],
      },
    },
  },
  Austrija: {
    id: 'Austrija',
    client: 'Austrija',
    defaults: { country: 'HR', client_group: 'interni', client: 'Administracija', product_group: 'Austrija' },
    unmatched: 'Graz',
    useDesk: false,
    types: { standard: 'var', cutout: 'var', other: 'var' },
    check: {
      Pamela: [/pamela/i, /skillsplatform/i],
      Wien: [
        /wien/i,
        /active beauty/i,
        /beč/i,
        /diva/i,
        /rapid/i,
        /sport ?magazin/i,
        /sportaktiv/i,
        /tortenmag/i,
        /miss/i,
        /klipp/i,
      ],
      Graz: [/graz/i, /diepresse/i, /austrija/i, /monat/i, /styria media/i],
    },
  },
  Asura: {
    id: 'Asura',
    client: 'TIZG',
    defaults: { country: 'HR', client_group: 'interni', client: 'TIZG', product_group: 'Asura' },
    unmatched: 'Asura',
    useDesk: false,
    types: { standard: 'var', cutout: 'var', other: 'var' },
    check: {
      Asura: [/.*/],
    },
  },
  'Red Point': {
    id: 'Red Point',
    client: 'RP',
    defaults: { country: 'HR', client_group: 'interni', client: 'RP', product_group: 'RP' },
    unmatched: 'Razno',
    useDesk: false,
    types: { standard: 'standard', cutout: 'cutout', other: 'montage' },
    check: {
      Zubak: [/zubak/i],
      Bjelovarski: [/bjelov/i],
      Pošta: [/po[sš]ta/i],
    },
  },
  Edukacija: {
    id: 'Administracija',
    client: 'Administracija',
    defaults: { country: 'HR', client_group: 'interni', client: 'Administracija', product_group: 'Edukacija' },
    unmatched: 'Trening',
    useDesk: false,
    types: { standard: 'var', cutout: 'var', other: 'var' },
    check: {
      Workshop: [/predavanje/i],
    },
  },
  'Eksterni klijent': {
    id: 'Eksterni klijent',
    client: 'Eksterni klijent',
    defaults: { country: 'HR', client_group: 'eksterni', client: 'Eksterni', product_group: 'Razno' },
    unmatched: 'Ostalo',
    useDesk: true,
    useGroup: false,
    types: { standard: 'standard', cutout: 'cutout', other: 'montage' },
    check: {
      'Red Point': [/red.?point/i, /bjelovarski/i],
      '7dnevno': [/7.?dnevno/i],
      'Soboške novine': [/sobo[sš]k[aei]/i],
      Pixsell: [/pixsel/i],
    },
  },
  'Interni klijent': {
    id: 'Interni klijent',
    client: 'RP',
    defaults: { country: 'HR', client_group: 'interni', client: 'RP', product_group: 'RP' },
    unmatched: 'Razno',
    useDesk: false,
    types: { standard: 'standard', cutout: 'cutout', other: 'montage' },
    check: {
      Bjelovarski: [/bjelov/i],
    },
  },
  'Poslovni dnevnik': {
    id: 'Poslovni dnevnik',
    client: 'PD',
    defaults: { country: 'HR', client_group: 'interni', client: 'PD', product_group: 'PD' },
    unmatched: 'Dnevnik',
    useDesk: true,
    types: { standard: 'standard', cutout: 'cutout', other: 'montage' },
    check: {
      Dnevnik: [/.+/i],
    },
  },
  Pixsell: {
    id: 'Pixsell',
    client: 'Pixsell',
    defaults: { country: 'HR', client_group: 'interni', client: 'Pixsell', product_group: 'Pixsell' },
    unmatched: 'Pixsell',
    useDesk: true,
    types: { standard: 'standard', cutout: 'cutout', other: 'montage' },
    check: {
      Pixsell: [/.+/i],
    },
  },
};
function humanFileSize(bytes, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
  return bytes.toFixed(dp) + ' ' + units[u];
}
function roughSizeOfObject(object) {
  var objectList = [];
  var stack = [object];
  var bytes = 0;
  while (stack.length) {
    var value = stack.pop();
    if (typeof value === 'boolean') {
      bytes += 4;
    } else if (typeof value === 'string') {
      bytes += value.length * 2;
    } else if (typeof value === 'number') {
      bytes += 8;
    } else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
      objectList.push(value);
      for (var i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
  // return humanFileSize(bytes);
}

function resolveAdministration(table) {
  if (!table.check) throw new Error(`Unknown client "${table.client}" in resolveAdministration()!`);

  if (table.useDesk) {
    if (table.desk && table.desk !== '') {
      return { ...table.defaults, product: table.desk };
    }
  }

  let matched = false;
  let group = false;

  if (table.useGroup) {
    for (const product_group in table.check) {
      if (matched) break;
      for (const product in table.check[product_group]) {
        if (matched) break;
        for (const regex of table.check[product_group][product]) {
          if (regex.test(table.product)) {
            matched = product;
            group = product_group;
            break;
          }
        }
      }
    }
  } else {
    for (const product in table.check) {
      if (matched) break;
      for (const regex of table.check[product]) {
        if (regex.test(table.product)) {
          matched = product;
          break;
        }
      }
    }
  }

  // Overwrites - fix some common input errors
  if (table.client === '24h' && matched === 'Njuškalo')
    return { ...productTable['Večernji list'].defaults, product: matched };

  if (group) {
    return { ...table.defaults, product_group: group, product: matched };
  } else {
    return { ...table.defaults, product: matched || table.unmatched };
  }
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
        /** row cheat sheet
         *   [0]  'vremenska'  '18.5.2017. 15:59:54',
         *   [1]  'ime'        'Karlo Toth',
         *   [2]  'datum'      '18.5.2017.',
         *   [3]  'klijent'    '24 sata',
         *   [4]  'desk'       '',
         *   [5]  'proizvod'   'Budi IN CHIC',
         *   [6]  'sn'         '8',
         *   [7]  'st'         '4:20:00',
         *   [8]  'cn'         '',
         *   [9]  'ct'         '',
         *  [10]  'on'         '',
         *  [11]  'ot'         '',
         *  [12]  'opis'       'BUDI IN EDITORIAL CHIC'
         */
        const datePattern = /(?<d>\d+)\.(?<m>\d+)\.(?<y>\d+)\./;
        const durationPattern = /(?<h>\d+)\:(?<m>\d+)(?:\:(?<s>\d+))?/;

        const output = {};
        const outputSize = roughSizeOfObject(rows);
        const outputDate = new Date().getTime();
        let index = 0;
        console.log(`Retreived ${humanFileSize(outputSize)} from google sheets...`);
        const metaSource = tools.handleSource(
          {
            name: 'google/administracija',
            size: outputSize,
            t_created: outputDate,
            t_modified: outputDate,
            t_parsed: outputDate,
          },
          'administracija',
          meta,
          db
        );
        for (const row of rows) {
          index += 1;
          if (!datePattern.test(row[2])) console.log(row[2]);
          const dateRaw = datePattern.exec(row[2]);
          const date = new Date(dateRaw.groups.y, dateRaw.groups.m, dateRaw.groups.d).getTime();
          const day = tools.handleDay(date, meta, db);

          const user = meta.users.admin[row[1]];
          if (!user) throw new Error(`What do you mean, there's no user ${row[1]} in meta.users.admin?`);

          if (!row[3] || row[3] === '') {
            console.log(row);
            throw new Error("What do you mean, there's no row[3] (klijent)?");
          }
          if (!row[5] || row[5] === '') {
            if (row[4] && row[4] !== '') {
              row[5] = row[4];
            } else {
              console.log(row);
              throw new Error("What do you mean, there's no row[5] (proizvod)?");
            }
          }
          if (!productTable[row[3]]) {
            console.log(row);
            throw new Error(`What do you mean, there's no productTable["${row[3]}"]?`);
          }
          let productRaw = { ...productTable[row[3]], client: row[3], desk: row[4], product: row[5] };
          const product = tools.handleProduct(resolveAdministration(productRaw), meta, db);

          const typeRaw = { standard: false, cutout: false, other: false };
          if (durationPattern.test(row[7]) || (row[6] && row[6] !== '')) {
            let dRaw = durationPattern.exec(row[7]);
            let duration = dRaw
              ? Number(dRaw.groups.h || 0) * 36e5 + Number(dRaw.groups.m || 0) * 6e4 + Number(dRaw.groups.s || 0) * 1e3
              : null;
            let amount = handleAmount({ n: row[6], t1: row[9], n1: row[8], t2: row[11], n2: row[10], raw: row });
            typeRaw.standard = { duration, amount };
          }
          if (durationPattern.test(row[9]) || (row[8] && row[8] !== '')) {
            let dRaw = durationPattern.exec(row[9]);
            let duration = dRaw
              ? Number(dRaw.groups.h) * 36e5 + Number(dRaw.groups.m) * 6e4 + Number(dRaw.groups.s) * 1e3
              : null;
            let amount = handleAmount({ n: row[8], t1: row[7], n1: row[6], t2: row[11], n2: row[10], raw: row });
            typeRaw.cutout = { duration, amount };
          }
          if (durationPattern.test(row[11]) || (row[10] && row[10] !== '')) {
            let dRaw = durationPattern.exec(row[11]);
            let duration = dRaw
              ? Number(dRaw.groups.h) * 36e5 + Number(dRaw.groups.m) * 6e4 + Number(dRaw.groups.s) * 1e3
              : null;
            let amount = handleAmount({ n: row[10], t1: row[7], n1: row[6], t2: row[9], n2: row[8], raw: row });
            typeRaw.other = { duration, amount };
          }

          // Provjera
          // console.log(row, product);
          function ms2h(ms) {
            if (!ms) ms = 0;
            let h = Math.floor(ms / 36e5);
            let m = Math.floor((ms / 6e4) % 60);
            let s = Math.floor((ms / 1e3) % 60);
            // h = h < 10 ? `0${h}` : `${h}`;
            m = m < 10 ? `0${m}` : `${m}`;
            s = s < 10 ? `0${s}` : `${s}`;
            return `${h}:${m}:${s}`;
          }
          function checkDurAm(type, typeRaw, row) {
            let a1 = '' + typeRaw[type].amount;
            let d1 = ms2h(typeRaw[type].duration);
            let a2;
            let d2;
            if (type === 'standard') {
              a2 = row[6];
              d2 = row[7];
            }
            if (type === 'cutout') {
              a2 = row[8];
              d2 = row[9];
            }
            if (type === 'other') {
              a2 = row[10];
              d2 = row[11];
            }
            // compensation
            if (!d2) d2 = '';
            if (a2 === '0') a2 = '';
            if (d2 === '0') d2 = '';
            if (a1 === '1' && a2 === '') a1 = '';
            if (d1 === '0:00:00' && d2 === '') d1 = '';

            if (d1 === d2 && a1 === a2) return true;

            console.log({ a1, a2, d1, d2 });
            console.log(typeRaw, row);
            console.log();
            return false;
          }

          for (const t in typeRaw) {
            if (typeRaw[t].duration || typeRaw[t].amount) {
              // checkDurAm(t, typeRaw, row);
              const type = meta.types[productRaw.types[t]];
              if (!type) throw new Error(`What do you mean, there is no "${productRaw.types[t]}" type in meta?`);
              const amount = typeRaw[t].amount + get(output, `[${day}][${product}][${user}][${type}].amount`, 0);
              const duration = typeRaw[t].duration + get(output, `[${day}][${product}][${user}][${type}].duration`, 0);
              if (get(output, `[${day}][${product}][${user}][${type}].index`, false)) console.log('check this');
              setWith(output, `[${day}][${product}][${user}][${type}]`, { id: index, amount, duration }, Object);
            }
          }

          // day -> product -> user -> type
          // const exists = get(output, `[${day}][${product}][${user}][${type}]`, false);

          // if (!exists) setWith(output, `["${klijent}"]["${desk}"]`, new Set(), Object);
          // output[klijent][desk].add(proizvod);
        }
        // console.log(JSON.stringify(unique, null, 3));
        console.log(`Parsed ${humanFileSize(roughSizeOfObject(output))} in output object...`);

        const transactionJobs = [];
        for (const days in output) {
          for (const metaJobs in output[days]) {
            for (const metaUsers in output[days][metaJobs]) {
              for (const metaTypes in output[days][metaJobs][metaUsers]) {
                const amount = output[days][metaJobs][metaUsers][metaTypes].amount;
                const duration = output[days][metaJobs][metaUsers][metaTypes].duration;
                const d_type = 0;
                transactionJobs.push({ days, metaJobs, metaSource, metaTypes, metaUsers, amount, duration, d_type });
              }
            }
          }
        }
        tools.insertTransactionJobs(transactionJobs, db);

        return true;

        function Set_toJSON(key, value) {
          if (typeof value === 'object' && value instanceof Set) {
            return [...value];
          }
          return value;
        }

        await fs.writeFile(path.join(paths.db, 'administracija.json'), JSON.stringify(unique, Set_toJSON, 6), 'utf-8');
        return true;
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
