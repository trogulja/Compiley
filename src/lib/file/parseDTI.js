'use strict';

// #region SetUp
const XLSX = require('xlsx');
const Datastore = require('nedb-promises');
const eh = require('../util/excelHelper');
const tools = require('../db/tools');
const { setWith, get } = require('lodash');
const notifier = require('../util/notifier');
// #endregion

async function parseDTI(file, meta, db) {
  /**
   * file == {
   *   name: '.\\test\\Slike 24_2018-01-01-09-05-13.xls',
   *   size: 10752,
   *   hash: '123123123123',
   * }
   */
  // Check for existing source, drop it from db if found!
  const source = tools.handleSource(file, 'dti', meta, db);

  const products = {
    ['24h']: /Slike ?24_\d{4}(?:-\d{2}){5}\.xlsx?/i,
    VL: /Slike ?VL_\d{4}(?:-\d{2}){5}\.xlsx?/i,
    PD: /Slike ?PD_\d{4}(?:-\d{2}){5}\.xlsx?/i,
    RP: /Slike ?RP_\d{4}(?:-\d{2}){5}\.xlsx?/i,
  };

  let prodMatch = false;
  for (const prod in products) {
    if (products[prod].test(file.name)) {
      prodMatch = prod;
    }
  }

  if (!prodMatch) {
    notifier.emit('warn', `Ignoring unkown file ${file.name}.`);
    return false;
  }
  // if (!prodMatch) console.log(file);
  // if (!prodMatch) throw new Error('What do you mean, unknown prod?');

  const country = 'HR';
  const client_group = 'interni';
  const client = prodMatch;
  const product_group = 'DTI';

  let wb, ws, sheet;
  try {
    wb = XLSX.readFile(file.path);
    ws = wb.Sheets[wb.SheetNames[0]];
    sheet = XLSX.utils.sheet_to_json(ws);
  } catch (error) {
    notifier.emit('error', `Unable to process file: ${file.path}, check for filters!`);
    console.log(error);
    return;
  }

  const jobsAtomic = new Datastore();
  const m4status = new Datastore();

  let index = 1;
  for (const row of sheet) {
    /**
     * id               - unique id of this file object
     * fileHeaderName   - filename, without extension
     * lastRefreshed    - xls date, file refreshed
     * oldStatusId      - before status change id
     * statusName       - before status change name
     * newStatusId      - new status id
     * statusName_1     - new status name
     * changeDate       - xls date, status change
     * deskName         - desk name
     * refreshedBy      - user name
     */
    row.changeDate = eh.date2ms(row.changeDate);
    row.lastRefreshed = eh.date2ms(row.lastRefreshed);
    if (!row.fileHeaderName) row.fileHeaderName = 'nema imena';
    row.fileHeaderName = eh.sanitizeString(row.fileHeaderName);
    index += 1;
    row.refreshedBy = row.refreshedBy ? (meta.users.dti[row.refreshedBy] || 'xx_' + row.refreshedBy) : null;
    // row.refreshedBy = meta.users.dti[row.refreshedBy] || 'xx_' + row.refreshedBy;
    // row.refreshedBy = meta.users.dti[row.refreshedBy] || null;

    // ignore unknown user
    if (!row.refreshedBy) continue;

    let testing = true;
    if (testing) {
      let ok = false; // test if we missed some status lines on first set
      if (row.statusName == '-' && row.oldStatusId == 0) ok = true;
      if (row.statusName == '-nema' && row.oldStatusId == 1) ok = true;
      if (row.statusName == '1 - Pogledaj info' && row.oldStatusId == 2) ok = true;
      if (row.statusName == '2a-Kolor' && row.oldStatusId == 3) ok = true;
      if (row.statusName == '2b-Kolor Obrez' && row.oldStatusId == 4) ok = true;
      if (row.statusName == '2c-CB' && row.oldStatusId == 5) ok = true;
      if (row.statusName == '2d-CB Obrez' && row.oldStatusId == 1418) ok = true;
      if (row.statusName == '2e-Kolor kadriranje' && row.oldStatusId == 264048) ok = true;
      if (row.statusName == '2h-Korigirati' && row.oldStatusId == 1422) ok = true;
      if (row.statusName == '3-Spremno' && row.oldStatusId == 1419) ok = true;
      if (row.statusName == '3-Spremno (obrez)' && row.oldStatusId == 1420) ok = true;
      if (row.statusName == '3-Spremno Aut.' && row.oldStatusId == 1421) ok = true;
      if (row.statusName == '3A-M4-Proces' && row.oldStatusId == 1423) ok = true;
      if (row.statusName == '2g-Automatska obrada' && row.oldStatusId == 264049) ok = true;
      if (!ok) console.log(`\n`, 'Name / ID mismatch', file.name, row);

      ok = false; // test if we missed some status lines on second set
      if (row.statusName_1 == '-' && row.newStatusId == 0) ok = true;
      if (row.statusName_1 == '-nema' && row.newStatusId == 1) ok = true;
      if (row.statusName_1 == '1 - Pogledaj info' && row.newStatusId == 2) ok = true;
      if (row.statusName_1 == '2a-Kolor' && row.newStatusId == 3) ok = true;
      if (row.statusName_1 == '2b-Kolor Obrez' && row.newStatusId == 4) ok = true;
      if (row.statusName_1 == '2c-CB' && row.newStatusId == 5) ok = true;
      if (row.statusName_1 == '2d-CB Obrez' && row.newStatusId == 1418) ok = true;
      if (row.statusName_1 == '2e-Kolor kadriranje' && row.newStatusId == 264048) ok = true;
      if (row.statusName_1 == '2h-Korigirati' && row.newStatusId == 1422) ok = true;
      if (row.statusName_1 == '3-Spremno' && row.newStatusId == 1419) ok = true;
      if (row.statusName_1 == '3-Spremno (obrez)' && row.newStatusId == 1420) ok = true;
      if (row.statusName_1 == '3-Spremno Aut.' && row.newStatusId == 1421) ok = true;
      if (row.statusName_1 == '3A-M4-Proces' && row.newStatusId == 1423) ok = true;
      if (row.statusName_1 == '2g-Automatska obrada' && row.newStatusId == 264049) ok = true;
      if (!ok) {
        if (row.newStatusId === 0 && row.statusName_1 === '3A-M4-Proces') {
          row.newStatusId = 1423;
        } else {
          console.log(`\n`, 'Name / ID mismatch', file.name, row);
        }
      }
    }

    const pDate = eh.breakDate(row.lastRefreshed);
    if (row.newStatusId == 1419) {
      // '3-Spremno'
      await jobsAtomic
        .insert({
          type: meta.types['standard'],
          time: row.lastRefreshed,
          time2: row.changeDate,
          row: index,
          day: tools.handleDay(row.lastRefreshed, meta, db),
          hour: pDate.hour,
          minute: pDate.minute,
          second: pDate.second,
          product: tools.handleProduct(
            { country, client_group, client, product_group, product: row.deskName },
            meta,
            db
          ),
          source: source,
          user: row.refreshedBy,
          name: row.fileHeaderName,
          duration: 0,
          d_type: 4,
        })
        .catch((e) => console.log(e));
    } else if (row.newStatusId == 1421) {
      // '3-Spremno Aut.'
      await jobsAtomic
        .insert({
          type: meta.types['auto'],
          time: row.lastRefreshed,
          time2: row.changeDate,
          row: index,
          day: tools.handleDay(row.lastRefreshed, meta, db),
          hour: pDate.hour,
          minute: pDate.minute,
          second: pDate.second,
          product: tools.handleProduct(
            { country, client_group, client, product_group, product: row.deskName },
            meta,
            db
          ),
          source: source,
          user: row.refreshedBy,
          name: row.fileHeaderName,
          duration: 0,
          d_type: 4,
        })
        .catch((e) => console.log(e));
    } else if (row.newStatusId == 1423) {
      // '3A-M4-Proces'
      await m4status
        .insert({
          time: row.changeDate,
          day: tools.handleDay(row.lastRefreshed, meta, db),
          hour: pDate.hour,
          minute: pDate.minute,
          second: pDate.second,
          id: Number(row.id),
        })
        .catch((e) => console.log(e));
      // m4status.push({ time: row.changeDate, date: generateDate(row.lastRefreshed), id: Number(row.id) });
    } else if (row.newStatusId == 1420) {
      // '3-Spremno (obrez)'
      const startTime = await m4status
        .find({ id: Number(row.id) })
        .sort({ time: -1 })
        .exec()
        .then(async (doc) => {
          if (doc[0]) {
            let time = doc[0].time;
            await m4status.remove({ id: Number(doc[0].id) }, { multi: true });
            return time;
          } else {
            return false;
          }
        })
        .catch((e) => console.log(e));

      let type = 'cutout';
      let duration = startTime ? row.changeDate - startTime : 0; // If we don't have duration, set 0
      let d_type = 0; // true if we have duration
      duration = Math.round(duration / 1000); // Convert duration from ms to s
      if (duration > 8 * 60 * 60) duration = 8 * 60 * 60; // Limit duration to 8h!
      if (row.oldStatusId != 1423) duration = 0; // TIBOR - ukoliko prethodni status nije M4-Process, prebaci u standardnu sliku!
      if (duration <= 0) {
        // If there is no time for cutout, we count that as Standard image!
        d_type = 4; // to be determined later
        duration = 0;
        type = 'standard';
      }

      await jobsAtomic
        .insert({
          type: meta.types[type],
          time: row.lastRefreshed,
          time2: row.changeDate,
          row: index,
          day: tools.handleDay(row.lastRefreshed, meta, db),
          hour: pDate.hour,
          minute: pDate.minute,
          second: pDate.second,
          product: tools.handleProduct(
            { country, client_group, client, product_group, product: row.deskName },
            meta,
            db
          ),
          source: source,
          user: row.refreshedBy,
          name: row.fileHeaderName,
          duration: duration,
          d_type: d_type,
        })
        .catch((e) => console.log(e));
    }
  }

  // save all stuff into db
  const results = await jobsAtomic.find({}).sort({ time: 1 });

  // prepare db transactions
  const tableJobs = {};
  for (const res of results) {
    /**
     * type: meta.types[type],
     * time: row.lastRefreshed,
     * day: tools.handleDay(row.lastRefreshed, meta, db),
     * hour: pDate.hour,
     * minute: pDate.minute,
     * second: pDate.second,
     * product: tools.handleProduct({country, client_group, client, product_group, product: row.deskName}, meta, db),
     * source: source,
     * user: row.refreshedBy,
     * file: row.fileHeaderName,
     * duration: duration,
     */
    // jobs: sum per source, day, product, type, user - set id
    // atom: get id - keep hour, minute, second, duration, d_type
    const id = get(tableJobs, `[${res.source}][${res.day}][${res.product}][${res.type}][${res.user}][id]`, res.row);
    const amount =
      get(tableJobs, `[${res.source}][${res.day}][${res.product}][${res.type}][${res.user}][amount]`, 0) + 1;
    const duration =
      get(tableJobs, `[${res.source}][${res.day}][${res.product}][${res.type}][${res.user}][duration]`, 0) +
      res.duration;

    res.id = id;
    setWith(
      tableJobs,
      `[${res.source}][${res.day}][${res.product}][${res.type}][${res.user}]`,
      { id, amount, duration, d_type: res.d_type },
      Object
    );
  }

  // Insert jobs into db
  const tableJobsId = {};
  for (const metaSource in tableJobs) {
    for (const days in tableJobs[metaSource]) {
      for (const metaJobs in tableJobs[metaSource][days]) {
        for (const metaTypes in tableJobs[metaSource][days][metaJobs]) {
          for (const metaUsers in tableJobs[metaSource][days][metaJobs][metaTypes]) {
            const id = tableJobs[metaSource][days][metaJobs][metaTypes][metaUsers].id;
            const amount = tableJobs[metaSource][days][metaJobs][metaTypes][metaUsers].amount;
            const duration = tableJobs[metaSource][days][metaJobs][metaTypes][metaUsers].duration;
            const d_type = tableJobs[metaSource][days][metaJobs][metaTypes][metaUsers].d_type;
            const jobid = tools.insertNewJob(
              { days, metaJobs, metaSource, metaTypes, metaUsers, amount, duration, d_type },
              db
            );
            if (jobid) tableJobsId[id] = jobid;
          }
        }
      }
    }
  }

  // Insert jobsAtomic into db
  const transactionJobsAtomic = [];
  let duplicatesDetected = false;
  for (const job of results) {
    // if (job.name.includes('JP019_057')) console.log(job)
    if (tableJobsId[job.id]) {
      // Make sure we push only jobs that have not failed tools.insertNewJob() func
      transactionJobsAtomic.push({
        jobs: tableJobsId[job.id],
        hour: job.hour,
        minute: job.minute,
        second: job.second,
        duration: job.duration,
        d_type: job.d_type,
        timestamp1: job.time,
        timestamp2: job.time2,
        name: job.name,
        row: job.row,
      });
    } else {
      duplicatesDetected = true;
    }
  }
  tools.insertTransactionJobsAtomic(transactionJobsAtomic, db);

  if (duplicatesDetected) {
    notifier.emit('warn', `Duplicate records found in ${file.name}`);
    // console.log('duplicate records found in', file.name);
    // console.log(file);
  }
  // console.log(transactionJobsAtomic);
  return true;
}

module.exports = parseDTI;
