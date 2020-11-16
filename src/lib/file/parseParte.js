'use strict';

// #region SetUp
const XLSX = require('xlsx');
const eh = require('../util/excelHelper');
const tools = require('../db/tools');
const { setWith, get } = require('lodash');
// #endregion

async function parseParte(file, meta, db) {
  const metaSource = tools.handleSource(file, 'parte', meta, db);
  const metaTypes = meta.types['standard'];
  const metaUsers = null;
  const duration = 120;
  const d_type = 3;

  let wb, ws, sheet;
  try {
    wb = XLSX.readFile(file.path);
    ws = wb.Sheets[wb.SheetNames[0]];
    sheet = XLSX.utils.sheet_to_json(ws, { header: ['id', 's1', 's2', 'user', 'time'] });
  } catch (error) {
    notifier.emit('error', `Unable to process file: ${file.path}, check for filters!`);
    console.log(error);
    return;
  }

  const transactionJobsAtomic = [];
  const tableJobs = {};
  for (const [index, row] of sheet.entries()) {
    if (!row.id) continue;
    if (typeof row.id !== 'number') continue;
    if (row.user !== 'm4obrada') continue;

    const date = eh.date2ms(row.time);
    const pDate = eh.breakDate(date);
    const day = tools.handleDay(date, meta, db);

    const id = get(tableJobs, `[${day}][id]`, index);
    const amount = get(tableJobs, `[${day}][amount]`, 0) + 1;

    setWith(tableJobs, `[${day}]`, { id, amount }, Object);

    transactionJobsAtomic.push({
      id,
      hour: pDate.hour,
      minute: pDate.minute,
      second: pDate.second,
      duration,
      d_type,
      timestamp1: date,
      timestamp2: date,
      name: row.id,
    });
  }

  const metaJobs = tools.handleProduct(
    { country: 'HR', client_group: 'interni', client: 'VL', product_group: 'ComponentLink', product: 'Parte' },
    meta,
    db
  );

  const tableJobsId = {};
  for (const days in tableJobs) {
    const oldID = tableJobs[days].id;
    const amount = tableJobs[days].amount;

    const jobid = tools.insertNewJob(
      { days, metaJobs, metaSource, metaTypes, metaUsers, amount, duration, d_type },
      db
    );
    if (jobid) tableJobsId[oldID] = jobid;
  }

  for (const job of transactionJobsAtomic) {
    job.jobs = tableJobsId[job.id];
  }
  tools.insertTransactionJobsAtomic(transactionJobsAtomic, db);

  return true;
}

module.exports = parseParte;
