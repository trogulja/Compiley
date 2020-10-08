const Database = require('better-sqlite3');
const path = require('path');
const paths = require('../util/pathHandler');
const getMeta = require('./meta');
const tools = require('./tools');

function main() {
  const db = new Database(paths.database);
  const db2 = new Database(path.join(paths.db, 'logClaro.db'));

  const getData = db2.prepare(`SELECT inspectTime AS timestamp,
    startName AS filename,
    channel,
    inspectUsername AS user,
    inspectPStime AS pstime,
    inspectCalcTime AS calctime
  FROM images
  WHERE (channel = 'klz-inspectorEdit' OR 
    channel = 'cro-inspectorEdit' OR 
    channel = 'cro-fullAuto' OR 
    channel = 'Werbemarkt - ColdSet' OR 
    channel = 'Werbemarkt - HeatSet - ISO Coated v2 300' OR 
    channel = 'Werbemarkt - HeatSet - PSO LWC Improved' OR 
    channel = 'Vanjski cro-inspectorEdit') AND 
    timestamp IS NOT NULL;
  `);

  /**
   * {
   *   timestamp1: 1527082606760,
   *   timestamp2: 1527082606760,
   *   filename: 'PXL_091117_18653931',
   *   channel: 'cro-inspectorEdit',
   *   user: 'levakand',
   *   pstime: 3,
   *   calctime: 12.5
   * }
   */
  const results = getData.all();

  const meta = getMeta(db);
  // console.log(meta);

  for (const result of results) {
    if (!result.timestamp) console.log(result)
    result.days = tools.handleDay(result.timestamp, meta, db);
    result.metaUsers = meta.users.claro[result.user];
  }

  const insert = db.prepare('INSERT INTO helperClaro (timestamp, days, filename, channel, metaUsers, pstime, calctime) VALUES (@timestamp, @days, @filename, @channel, @metaUsers, @pstime, @calctime)');

  const insertMany = db.transaction((claros) => {
    for (const claro of claros) insert.run(claro);
  });

  insertMany(results);

  db.close();
  db2.close();
  return true;
}

main();
