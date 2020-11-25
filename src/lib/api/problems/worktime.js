const Database = require('better-sqlite3');
const paths = require('../../util/pathHandler');
const notifier = require('../../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting problems/worktime data.`);

  const db = new Database(paths.database);
  const sql = db.prepare(
    `SELECT days.day, days.month, days.year, metaUsers.name AS user, worktime.d_working, worktime.d_presence, (CASE WHEN d_working > d_presence THEN 'Rad, a nema prisutnosti' ELSE 'Prisutnost, a nije ništa upisano' END) AS problem, metaSource.name AS source FROM worktime LEFT JOIN days ON worktime.days = days.id LEFT JOIN metaSource ON worktime.metaSource = metaSource.id LEFT JOIN metaUsers ON worktime.metaUsers = metaUsers.id WHERE (d_presence = 0 AND d_working > 1800) OR ( (d_working IS NULL OR d_working < 1) AND metaUsers IS NOT 6 AND d_presence > 1800) ORDER BY year DESC, month DESC, day DESC, user ASC;`
  );
  const result = sql.all();

  try {
    res.send(result);
  } catch (error) {
    console.log('sending caused error');
    console.log(error);
  }

  db.close();
};
