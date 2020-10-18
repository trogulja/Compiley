'use strict';

// #region SetUp
const XLSX = require('xlsx');
const Datastore = require('nedb-promises');
const eh = require('../util/excelHelper');
const tools = require('../db/tools');
const { setWith, get } = require('lodash');
// #endregion

async function parseEasyjob(file, meta, db) {
  /**
   * file == {
   *   name: '.\\test\\Slike 24_2018-01-01-09-05-13.xls',
   *   size: 10752,
   *   t_created: 1601152576391.5225,
   *   t_modified: 1601152576391.5225,
   *   t_parsed: 1601313389239
   * }
   */
  // Check for existing source, drop it from db if found!
  const source = tools.handleSource(file, 'easyjob', meta, db);

  let wb = XLSX.readFile(file.path);
  let ws = wb.Sheets['GMI Stundenabfrage'];
  let sheet = XLSX.utils.sheet_to_json(ws, {
    header: ['date', 'user', 'u', 's1', 's2', 'compare', 'type', 'leistung', 'leistung2', 'type2', 'hours', 'amount', 'text', 'job', 'jobnr', 'kunde', 'produkt', 'referenz'],
  });

  let index = 0;
  const tableJobs = {};

  for (const row of sheet) {
    let temp = {
      date: '29.01.18',
      user: 'Ivana Vukovic',
      u: 'IVU',
      s1: 'Sonstige',
      s2: 'S',
      compare: 'FCL-0044-1801 / IVU;29.01.2018;corrections;MontageRetusc',
      type: 'MontageRetusche',
      leistung: 'IVU;29.01.2018;corrections;MontageRetusc',
      leistung2: 'IVU;29.01.2018;corrections;MontageRetusc',
      type2: 'MontageRetusche',
      hours: 0,
      amount: 6,
      text: 'corrections',
      job: 'Diva_01-18_284',
      jobnr: 'FCL-0044-1801',
      kunde: 'Styria Medienhaus Lifesty (AT)',
      produkt: 'Diva',
      referenz: 'Heatset',
    };
    index += 1;
    if (index < 2) continue;
    if (!row.date) console.log(row);

    const dateRaw = row.date.split('.');
    const date = new Date(Number(`${dateRaw[2] > 78 ? '19' : '20'}${dateRaw[2]}`), Number(dateRaw[1]) - 1, Number(dateRaw[0])).getTime();
    const day = tools.handleDay(date, meta, db);
    const user = meta.users.easyjob[row.user] || null;
    const product = tools.handleProduct(row.produkt, meta, db);
    // console.log(row);
  }

  tableJobs = {
    metaSource: {
      days: {
        metaJobs: {
          metaTypes: {
            metaUsers: {
              amount: 0,
              duration: 0,
              d_type: 0,
            },
          },
        },
      },
    },
  };
}

module.exports = parseEasyjob;
