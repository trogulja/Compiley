const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');
const notifier = require('../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting worktime data.`);

  const db = new Database(paths.database)
  const sql = db.prepare(`SELECT worktime.d_presence, worktime.d_working, days.day, days.month, days.year, metaSource.name AS source, metaUsers.name AS user FROM worktime LEFT JOIN days ON worktime.days = days.id LEFT JOIN metaSource ON worktime.metaSource = metaSource.id LEFT JOIN metaUsers ON worktime.metaUsers = metaUsers.id WHERE d_presence > 0 OR d_working > 0;`);
  const result = sql.all();

  try {
    res.send(result);
  } catch (error) {
    console.log('sending caused error');
    console.log(error);
  }

  db.close();
};
