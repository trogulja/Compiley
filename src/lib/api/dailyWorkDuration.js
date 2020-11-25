const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');
const notifier = require('../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting dailyWorkDuration data.`);

  const db = new Database(paths.database)
  const sql = db.prepare(`SELECT days.id, days.day, days.month, days.year, (CASE strftime('%w', round(days.timestamp / 1000), 'unixepoch', 'localtime') WHEN '0' THEN 'Nedjelja' WHEN '1' THEN 'Ponedjeljak' WHEN '2' THEN 'Utorak' WHEN '3' THEN 'Srijeda' WHEN '4' THEN 'Četvrtak' WHEN '5' THEN 'Petak' WHEN '6' THEN 'Subota' END) AS weekday, ifnull( ( SELECT round(sum(duration) ) FROM jobs LEFT JOIN metaJobs ON jobs.metaJobs = metaJobs.id WHERE jobs.days = days.id AND metaJobs.client = '24h' ), 0) AS sum_duration_24h, ifnull( ( SELECT round(sum(duration) ) FROM jobs LEFT JOIN metaJobs ON jobs.metaJobs = metaJobs.id WHERE jobs.days = days.id AND metaJobs.client = 'VL' ), 0) AS sum_duration_VL, ifnull( ( SELECT round(sum(duration) ) FROM jobs LEFT JOIN metaJobs ON jobs.metaJobs = metaJobs.id WHERE jobs.days = days.id AND metaJobs.client = 'PD' ), 0) AS sum_duration_PD, ifnull( ( SELECT round(sum(duration) ) FROM jobs LEFT JOIN metaJobs ON jobs.metaJobs = metaJobs.id WHERE jobs.days = days.id AND metaJobs.country = 'AU' ), 0) AS sum_duration_AU, ifnull( ( SELECT round(sum(duration) ) FROM jobs LEFT JOIN metaJobs ON jobs.metaJobs = metaJobs.id WHERE jobs.days = days.id AND metaJobs.country = 'HR' ), 0) AS sum_duration_HR, ifnull( ( SELECT round(sum(duration) ) FROM jobs WHERE jobs.days = days.id ), 0) AS sum_duration, ifnull( ( SELECT round(sum(d_presence) ) FROM worktime WHERE worktime.days = days.id ), 0) AS sum_duration_worktime FROM days ORDER BY year DESC, month DESC, day DESC`);
  const result = sql.all();

  try {
    res.send(result);
  } catch (error) {
    console.log('sending caused error');
    console.log(error);
  }

  db.close();
};
