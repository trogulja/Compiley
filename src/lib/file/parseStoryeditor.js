'use strict';

// #region SetUp
const XLSX = require('xlsx');
const Datastore = require('nedb-promises');
const eh = require('../util/excelHelper');
const tools = require('../db/tools');
const { setWith, get } = require('lodash');
const notifier = require('../util/notifier');
// #endregion

const PROCESS_BY_NAMES_MAP = {
  ['Dejan Barlek']: 'BARLEKDE',
  ['Kresimir Bikic']: 'BIKICKRE',
  ['Tomislav Car']: 'CARTOMIS',
  ['Majda Desnica']: 'DESNICMA',
  ['Silvija Krajcar']: 'KRAJCASI',
  ['Dejan Kumpar']: 'KUMPARDE',
  ['Andrea Levak']: 'LEVAKAND',
  ['Bozica Preberina-Olah']: 'PREBERBO',
  ['Tibor Rogulja']: 'ROGULJTI',
  ['Natasa Secki']: 'SECKINAT',
  ['Karlo Toth']: 'TOTHKARL',
  ['Ivana Vukovic']: 'VUKOVIIV',
  ['Jasmina Alihodzic']: 'ALIHODJA',
  ['Nina Varga']: 'VARGANIN',
  ['Ivana Kos']: 'KOSIVANA',
}

async function parseStoryeditor(file, meta, db) {
  /**
   * file == {
   *   name: '.\\test\\Slike_Storyeditor_24sata_tjedno_2021-11-15.xls',
   *   size: 10752,
   *   t_created: 1601152576391.5225,
   *   t_modified: 1601152576391.5225,
   *   t_parsed: 1601313389239
   * }
   */
  // Check for existing source, drop it from db if found!
  const source = tools.handleSource(file, 'storyeditor', meta, db);

  const country = 'HR';
  const client_group = 'interni';
  // const client = prodMatch;
  const product_group = 'Storyeditor';

  let wb, ws, sheet, trimmedSheet, sheetRaw;
  try {
    wb = XLSX.readFile(file.path);
    ws = wb.Sheets[wb.SheetNames[0]];
    sheetRaw = XLSX.utils.sheet_to_json(ws, {header: 1, blankrows: false});
    trimmedSheet = XLSX.utils.json_to_sheet(sheetRaw, {header: sheetRaw[0], skipHeader: true});
    sheet = XLSX.utils.sheet_to_json(trimmedSheet);
  } catch (error) {
    notifier.emit('error', `Unable to process file: ${file.path}, check for filters!`);
    console.log(error);
    return;
  }

  const filteredSheet = sheet.filter(row => row.processbyName);
  const results = [];
  let index = 1;

  for (const row of filteredSheet) {
    /**
    * mediaID: 4535,
    * process_type: 'D',
    * filename: '5919-4535-PXL_220621_33363166',
    * remark: 'OBREZ',
    * extension: '.jpg',
    * sendbyName: 'Kristijan Zinaja',
    * sendtime: 44508.45914351852,
    * startprocesstime: 44508.46796296296,
    * processtime: 44508.48809027778,
    * gettime: 44508.504849537036,
    * processbyName: 'Bozica Preberina-Olah',
    * groupname: '24_Grafičar',
    * projectname: '1-UTO_2021_11_09',
    * description: '24sata',
    * full_path: '\\\\10.64.10.211\\press\\composition\\ROOT\\24sata\\2021-11-09\\1-UTO_2021_11_09\\Links\\Media\\5919-4535-PXL_220621_33363166.jpg',
    * need_path: 'Y'
    */

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
     const type = row.need_path === 'Y' ? meta.types['cutout'] : meta.types['standard'];
     const time = eh.date2ms(row.processtime);
     const time2 = eh.date2ms(row.startprocesstime);
     const day = tools.handleDay(time, meta, db);
     const hour = eh.breakDate(time).hour;
     const minute = eh.breakDate(time).minute;
     const second = eh.breakDate(time).second;
     const product = tools.handleProduct({country, client_group, client: row.description, product_group, product: row.description}, meta, db)
     const user = meta.users.dti[PROCESS_BY_NAMES_MAP[row.processbyName]] || null;
     const name = eh.sanitizeString(row.filename);
     const duration = 0;
     const d_type = 4;
 
     // ignore unknown user
     if (!user) continue;
 
     results.push({type, time, time2, row: index++, day, hour, minute, second, product, source, user, name, duration, d_type}) 
  }

  // save all stuff into db
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

module.exports = parseStoryeditor;
