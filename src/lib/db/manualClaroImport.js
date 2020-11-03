'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const paths = require('../util/pathHandler');
const tools = require('./tools');
const notifier = require('../util/notifier');

function main(meta, db) {
  const time = new Date().getTime();
  const db2 = new Database(path.join(paths.db, 'logClaro.db'));

  const jobs = [
    {
      name: 'dtiInspector',
      type: 1,
      sql: `SELECT inspectTime AS timestamp, startName AS filename, channel, inspectUsername AS user, inspectPStime AS pstime, inspectCalcTime AS calctime FROM images WHERE channel='cro-inspectorEdit' AND timestamp IS NOT NULL;`,
    },
    {
      name: 'dtiAutomatic',
      type: 2,
      sql: `SELECT endTime AS timestamp, startName AS filename, channel, inspectUsername AS user, ((endTime - startTime) / 1000) AS pstime, ((endTime - startTime) / 1000) AS calctime FROM images WHERE channel = 'cro-fullAuto'`,
    },
    {
      name: 'klzInspector',
      type: 3,
      sql: `SELECT inspectTime AS timestamp, startName AS filename, channel, inspectUsername AS user, inspectPStime AS pstime, inspectCalcTime AS calctime FROM images WHERE channel = 'klz-inspectorEdit' AND timestamp IS NOT NULL;`,
    },
    {
      name: 'klzAutomatic',
      type: 4,
      sql: `SELECT endTime AS timestamp, startName AS filename, channel, inspectUsername AS user, ( (endTime - startTime) / 1000) AS pstime, ( (endTime - startTime) / 1000) AS calctime FROM images WHERE channel = 'klz-01-fullAuto';`,
    },
    {
      name: 'klzElvis',
      type: 5,
      sql: `SELECT endTime AS timestamp, startName AS filename, channel, inspectUsername AS user, ( (endTime - startTime) / 1000) AS pstime, ( (endTime - startTime) / 1000) AS calctime FROM images WHERE channel = 'klz-99-sendToElvis';`,
    },
    {
      name: 'otherInspector',
      type: 6,
      sql: `SELECT inspectTime AS timestamp, startName AS filename, channel, inspectUsername AS user, inspectPStime AS pstime, inspectCalcTime AS calctime FROM images WHERE (channel = 'Werbemarkt - ColdSet' OR channel = 'Werbemarkt - HeatSet - ISO Coated v2 300' OR channel = 'Werbemarkt - HeatSet - PSO LWC Improved' OR channel = 'Vanjski cro-inspectorEdit') AND timestamp IS NOT NULL;`,
    },
  ];

  const insert = db.prepare(
    'INSERT OR IGNORE INTO helperClaro (type, timestamp, days, filename, channel, metaUsers, pstime, calctime) VALUES (@type, @timestamp, @days, @filename, @channel, @metaUsers, @pstime, @calctime)'
  );
  const insertMany = db.transaction((claros) => {
    for (const claro of claros) insert.run(claro);
  });

  for (const job of jobs) {
    const results = db2.prepare(job.sql).all();

    for (const result of results) {
      // timestamp: 1527082606760,
      // filename: 'PXL_091117_18653931',
      // channel: 'cro-inspectorEdit',
      // user: 'levakand', || NULL
      // pstime: 3,
      // calctime: 12.5
      result.days = tools.handleDay(result.timestamp, meta, db);
      result.metaUsers = result.user ? meta.users.claro[result.user] : null;
      result.type = job.type;
    }

    insertMany(results);
  }

  db2.close();
  notifier.emit('info', `manualClaroImport() - Data collected in ${ new Date().getTime() - time }ms`)
  return true;
}

module.exports = main;
