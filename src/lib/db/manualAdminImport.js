'use strict';

const fs = require('fs').promises;
const path = require('path');
const paths = require('../util/pathHandler');
const readline = require('readline');
const { google } = require('googleapis');
const { get, setWith } = require('lodash');

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

        const unique = {};
        for (const row of rows) {
          if (!datePattern.test(row[2])) console.log(row[2]);
          const dateRaw = datePattern.exec(row[2]);
          const date = new Date(dateRaw.groups.y, dateRaw.groups.m, dateRaw.groups.d);
          const user = meta.users.admin[row[1]];

          const klijent = row[3];
          const desk = row[4];
          const proizvod = row[5];

          const exists = get(unique, `["${klijent}"]["${desk}"]`, false)

          if (!exists) setWith(unique, `["${klijent}"]["${desk}"]`, new Set(), Object)
          unique[klijent][desk].add(proizvod)
        }
        // console.log(JSON.stringify(unique, null, 3));
        function Set_toJSON(key, value) {
          if (typeof value === 'object' && value instanceof Set) {
            return [...value];
          }
          return value;
        }

        await fs.writeFile(path.join(paths.db, 'administracija.json'), JSON.stringify(unique, Set_toJSON, 6) , 'utf-8')
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
