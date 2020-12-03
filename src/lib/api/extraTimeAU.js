const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');
const notifier = require('../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting extraTimeAU data.`);

  const db = new Database(paths.database)
  const sql = db.prepare(`SELECT year, month, day, amount, pstime, calctime, calctime - pstime AS diff, user FROM ( SELECT year, month, day, count( * ) AS amount, sum(CASE WHEN pstime IS NULL THEN 0 ELSE pstime END) AS pstime, sum(calctime) AS calctime, metaUsers.name AS user FROM helperClaro LEFT JOIN days ON helperClaro.days = days.id LEFT JOIN metaUsers ON helperClaro.metaUsers = metaUsers.id WHERE type IN (3, 4, 5, 6) AND channel IS NOT 'Vanjski cro-inspectorEdit' AND helperClaro.metaUsers IS NOT 6 AND helperClaro.metaUsers IS NOT NULL GROUP BY year, month, day, user ) ORDER BY year DESC, month DESC, day DESC, user ASC`);
  const result = sql.all();

  try {
    res.send(result);
  } catch (error) {
    console.log('sending caused error');
    console.log(error);
  }

  db.close();
};
