const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');
const notifier = require('../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting metaJobs data.`);

  const db = new Database(paths.database)
  const sql = db.prepare(`SELECT country, client_group, client, product_group, product, ( SELECT CASE count(product) WHEN 1 THEN NULL ELSE count(product) END FROM metaJobs total WHERE total.product = metaJobs.product ) AS duplicates, ifnull(metaPrintTypes.type, '-') AS printType, ifnull(metaPrintTypes.color_profile, '-') AS colorProfile FROM metaJobs LEFT JOIN metaPrintTypes ON metaJobs.metaPrintTypes = metaPrintTypes.id ORDER BY country DESC, client_group DESC, client ASC, product ASC`);
  const result = sql.all();

  try {
    res.send(result);
  } catch (error) {
    console.log('sending caused error');
    console.log(error);
  }

  db.close();
};
