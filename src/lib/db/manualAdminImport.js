'use strict';

const fs = require('fs').promises;
const path = require('path');
const paths = require('../util/pathHandler');
const readline = require('readline');
const { google } = require('googleapis');
const { get, setWith } = require('lodash');
const tools = require('../db/tools');
const extras = require('../util/extras');
const notifier = require('../util/notifier');

const productTable = {
  '24 sata': {
    id: '24 sata',
    client: '24h',
    defaults: { country: 'HR', client_group: 'interni', client: '24h', product_group: 'admin' },
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
    defaults: { country: 'HR', client_group: 'interni', client: 'VL', product_group: 'admin' },
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
    defaults: { country: 'HR', client_group: 'interni', client: 'RP', product_group: 'admin' },
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
    defaults: { country: 'HR', client_group: 'interni', client: 'RP', product_group: 'admin' },
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
    defaults: { country: 'HR', client_group: 'interni', client: 'PD', product_group: 'admin' },
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
    defaults: { country: 'HR', client_group: 'interni', client: 'Pixsell', product_group: 'admin' },
    unmatched: 'Pixsell',
    useDesk: true,
    types: { standard: 'standard', cutout: 'cutout', other: 'montage' },
    check: {
      Pixsell: [/.+/i],
    },
  },
};

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
  o = Number(o);
  if (isNaN(o)) o = 0;
  return o;
}

function handleDuration(res) {
  if (!res.groups) throw new Error(`handleDuration() is missing res.groups: ${JSON.stringify(res)}`);
  return Number(res.groups.h || 0) * 3600 + Number(res.groups.m || 0) * 60 + Number(res.groups.s || 0);
}

function reportError(row, string) {
  console.log(row);
  throw new Error(string);
}

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(paths.db, 'token.json');

async function mainParser(meta, db) {
  let content, result;
  notifier.emit('ok', `Connecting to google sheets...`);
  const time = new Date().getTime();

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
    notifier.emit('warn', `Authorize this app by visiting this url: ${authUrl}`);
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
        const outputSize = extras.roughSizeOfObject(rows);
        const outputDate = new Date().getTime();
        let index = 0;
        notifier.emit('ok', `Retreived ${extras.humanFileSize(outputSize)} from google sheets...`);
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
          const date = new Date(dateRaw.groups.y, dateRaw.groups.m - 1, dateRaw.groups.d).getTime();
          const day = tools.handleDay(date, meta, db);

          const user = meta.users.admin[row[1]];
          if (!user) reportError(row, `${row[1]} in missing in meta.users.admin!`);
          if (!row[3] || row[3] === '') reportError(row, `row[3] (klijent) should not be empty!`);
          if (!row[5] || row[5] === '') if (row[4] && row[4] !== '') row[5] = row[4];
          if (!row[5] || row[5] === '') reportError(row, `row[5] (proizvod) & row[4] (desk) should not be empty!`);
          if (!productTable[row[3]]) reportError(row, `productTable["${row[3]}"] is not defined!`);

          let productRaw = { ...productTable[row[3]], client: row[3], desk: row[4], product: row[5] };
          const product = tools.handleProduct(resolveAdministration(productRaw), meta, db);

          const typeRaw = {
            standard: { duration: 0, amount: 0 },
            cutout: { duration: 0, amount: 0 },
            other: { duration: 0, amount: 0 },
          };
          if (row[6] && row[6] !== '') typeRaw.standard.amount = handleAmount(row[6]);
          if (durationPattern.test(row[7])) typeRaw.standard.duration = handleDuration(durationPattern.exec(row[7]));
          if (row[8] && row[8] !== '') typeRaw.cutout.amount = handleAmount(row[8]);
          if (durationPattern.test(row[9])) typeRaw.cutout.duration = handleDuration(durationPattern.exec(row[9]));
          if (row[10] && row[10] !== '') typeRaw.other.amount = handleAmount(row[10]);
          if (durationPattern.test(row[11])) typeRaw.other.duration = handleDuration(durationPattern.exec(row[11]));

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
        }
        // console.log(JSON.stringify(unique, null, 3));
        notifier.emit('ok', `Parsed ${extras.humanFileSize(extras.roughSizeOfObject(output))} in output object...`);

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
      } else {
        notifier.emit('error', 'No data found.');
      }
    } catch (err) {
      notifier.emit('error', `The API returner an error: ${err}`);
    }
    return true;
  }

  try {
    content = await fs.readFile(path.join(paths.db, 'credentials.json'));
  } catch (err) {
    return console.log('Error loading client secret file:', err);
  }

  try {
    result = await authorize(JSON.parse(content), getAdmin);
  } catch (err) {
    console.log(err);
    console.log('Ovdje ne bi trebalo doć do errora.');
  }

  notifier.emit('info', `manualAdminImport() - Data collected in ${new Date().getTime() - time}ms`);
  return result;
}

module.exports = mainParser;
// mainParser().then(console.log);
