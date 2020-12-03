const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');
const notifier = require('../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting hourly data.`);

  const db = new Database(paths.database)
  const sql = db.prepare(`SELECT year, month, day, hour, count( * ) AS amount, sum(duration) AS duration, ( SELECT sum_images_atomic * 1.0 / sum_images FROM days WHERE days.id = daysID ) AS accuracy FROM ( SELECT jobsAtomic.timestamp1 AS timestamp, days.id AS daysID, days.year, days.month, days.day, jobsAtomic.hour, jobsAtomic.duration AS duration FROM jobsAtomic LEFT JOIN jobs ON jobsAtomic.jobs = jobs.id LEFT JOIN days ON jobs.days = days.id UNION ALL SELECT helperClaro.timestamp AS timestamp, days.id AS daysID, days.year, days.month, days.day, CAST (strftime('%H', round(helperClaro.timestamp / 1000), 'unixepoch', 'localtime') AS INTEGER) AS hour, helperClaro.calctime AS duration FROM helperClaro LEFT JOIN days ON helperClaro.days = days.id WHERE helperClaro.type IN (3, 4, 5, 6) AND helperClaro.processed IS NOT 1 ) GROUP BY year, month, day, hour ORDER BY timestamp DESC`);
  const result = sql.all();

  try {
    res.send(result);
  } catch (error) {
    console.log('sending caused error');
    console.log(error);
  }

  db.close();
};
