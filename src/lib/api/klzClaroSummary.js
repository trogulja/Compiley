const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');
const notifier = require('../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting klzClaroSummary data.`);

  const db = new Database(paths.database)
  const sql = db.prepare(`SELECT days.year, days.month, count(CASE helperClaro.type WHEN 7 THEN 1 ELSE NULL END) AS input, count(CASE helperClaro.type WHEN 3 THEN 1 ELSE NULL END) AS inspector, count(CASE helperClaro.type WHEN 4 THEN 1 ELSE NULL END) AS automatic, count(CASE helperClaro.type WHEN 5 THEN 1 ELSE NULL END) AS elvis FROM helperClaro LEFT JOIN days ON helperClaro.days = days.id WHERE helperClaro.type = 7 OR helperClaro.type = 3 OR helperClaro.type = 4 OR helperClaro.type = 5 GROUP BY days.year, days.month;`);
  const result = sql.all()

  try {
    res.send(result);
  } catch (error) {
    console.log('sending caused error');
    console.log(error);
  }

  db.close();
};
