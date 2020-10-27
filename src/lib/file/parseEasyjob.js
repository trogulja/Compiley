'use strict';

// #region SetUp
const XLSX = require('xlsx');
const eh = require('../util/excelHelper');
const tools = require('../db/tools');
const { setWith, get } = require('lodash');
// #endregion
function hours2ms(h) {
  return h * 3.6e6;
}

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

  const wb = XLSX.readFile(file.path);
  const ws = wb.Sheets['GMI Stundenabfrage'];
  const sheet = XLSX.utils.sheet_to_json(ws, {
    header: [
      'date',
      'user',
      'u',
      's1',
      's2',
      's3',
      'type',
      's4',
      's5',
      'type2',
      'hours',
      'amount',
      'note',
      'product',
      'jobnr',
      'client',
      'product_group',
      'print_type',
    ],
  });

  /**
   * Datum                   => date          ... '29.01.18'
   * Mitarbeiter             => user          ... 'Ivana Vukovic'
   * MA                      => u             ... 'IVU'
   * Zu.Art.                 => s1            ... 'Sonstige'
   * Art                     => s2            ... 'S'
   * Zu-Art                  => s3            ... 'FCL-0044-1801 / IVU;29.01.2018;corrections;MontageRetusc'
   * Leistungsart            => type          ... 'MontageRetusche'
   * Leistung                => s4            ... 'IVU;29.01.2018;corrections;MontageRetusc'
   * Leistungbesuchreibung   => s5            ... 'IVU;29.01.2018;corrections;MontageRetusc'
   * Std.Art                 => type2         ... 'MontageRetusche'
   * Stunden                 => hours         ... 0
   * Menge                   => amount        ... 6
   * Text                    => note          ... 'corrections'
   * JobBezeichung           => product       ... 'Diva_01-18_284'
   * Job Nummer              => jobnr         ... 'FCL-0044-1801'
   * Kunde                   => client        ... 'Styria Medienhaus Lifesty (AT)'
   * Produkt                 => product_group ... 'Diva'
   * Job externe Referenz VK => print_type    ... 'Heatset'
   */

  let index = 0;
  const country = 'AU';
  const client_group = 'easyjob';
  const tableJobs = {};

  for (const row of sheet) {
    index += 1;
    if (!row.date) continue;
    if (!row.type && !row.type2) continue;
    const dateRaw = row.date.split('.');
    if (dateRaw.length !== 3) continue;

    const user = meta.users.easyjob[row.user] || null;
    if (row.user === 'Winona Pilat' || row.user === 'Marianne Neuhold') continue;
    if (!user) console.log(row);
    if (!user) continue;

    const date = new Date(
      Number(`${dateRaw[2] > 78 ? '19' : '20'}${dateRaw[2]}`),
      Number(dateRaw[1]) - 1,
      Number(dateRaw[0])
    ).getTime();
    const day = tools.handleDay(date, meta, db);
    if (!row.amount) row.amount = 0;
    if (!row.duration) row.duration = 0;
    row.duration = eh.hour2ms(row.duration);
    const product = tools.handleProduct(
      { country, client_group, client: row.client, product_group: row.product_group, product: row.product },
      meta,
      db
    );
    const typeOptions = {
      Standardbild: 'standard',
      Cutout: 'cutout',
      MontageRetusche: 'montage',
      DigitalBriefing: 'briefing',
      Projektleistung: 'project',
      DigitalProgrammierung: 'coding',
      AutomBilder: 'auto',
      HalbautomBilder: 'halfauto',
      AnzeigeGestalten: 'standard',
      'Fixkosten inkl.Gewinnaufschl. ger.Seiten': 'standard',
    };
    const type = row.type ? meta.types[typeOptions[row.type]] : row.type2 ? meta.types[typeOptions[row.type2]] : false;

    if (type === false) continue; // user never entered type in easyjob, skip it

    if (!type) {
      // previously unseen type, need to manage it!
      console.log(row);
      console.log('typeOptions[row.type]', typeOptions[row.type]);
      console.log(meta.types);
      throw new Error('What do you mean, type undefined?!');
    }

    if (day === 59 && product === 82 && source === 2052 && user === 7) console.log(row);

    const id = get(tableJobs, `[${source}][${day}][${product}][${type}][${user}][id]`, index);
    const amount = get(tableJobs, `[${source}][${day}][${product}][${type}][${user}][amount]`, 0) + row.amount;
    const duration = get(tableJobs, `[${source}][${day}][${product}][${type}][${user}][duration]`, 0) + row.duration;
    // console.log(row);

    setWith(
      tableJobs,
      `[${source}][${day}][${product}][${type}][${user}]`,
      {
        id,
        amount,
        duration,
        d_type: 0,
      },
      Object
    );
  }

  const transactionJobs = [];
  for (const metaSource in tableJobs) {
    for (const days in tableJobs[metaSource]) {
      for (const metaJobs in tableJobs[metaSource][days]) {
        for (const metaTypes in tableJobs[metaSource][days][metaJobs]) {
          for (const metaUsers in tableJobs[metaSource][days][metaJobs][metaTypes]) {
            const amount = tableJobs[metaSource][days][metaJobs][metaTypes][metaUsers].amount || 1;
            const duration = tableJobs[metaSource][days][metaJobs][metaTypes][metaUsers].duration;
            const d_type = tableJobs[metaSource][days][metaJobs][metaTypes][metaUsers].d_type;
            transactionJobs.push({ days, metaJobs, metaSource, metaTypes, metaUsers, amount, duration, d_type });
          }
        }
      }
    }
  }
  tools.insertTransactionJobs(transactionJobs, db);

  return true;
}

module.exports = parseEasyjob;
