const Database = require('better-sqlite3');
const paths = require('../../util/pathHandler');
const notifier = require('../../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting problems/amount data.`);

  const db = new Database(paths.database);
  const sql = db.prepare(
    `SELECT jobs.duration, days.day, days.month, days.year, metaJobs.country, metaJobs.client_group, metaJobs.client, metaJobs.product_group, metaJobs.product, metaSource.name AS source, metaTypes.name AS type, metaUsers.name AS user FROM jobs LEFT JOIN days ON jobs.days = days.id LEFT JOIN metaJobs ON jobs.metaJobs = metaJobs.id LEFT JOIN metaSource ON jobs.metaSource = metaSource.id LEFT JOIN metaTypes ON jobs.metaTypes = metaTypes.id LEFT JOIN metaUsers ON jobs.metaUsers = metaUsers.id LEFT JOIN metaPrintTypes ON metaJobs.metaPrintTypes = metaPrintTypes.id WHERE jobs.amount < 1 AND product_group IS NOT 'Sastanak' AND product_group IS NOT 'Održavanje' AND product_group IS NOT 'Razvoj' AND product_group IS NOT 'Edukacija' AND product IS NOT 'Administracija' AND product IS NOT 'Pamela' AND metaTypes.name IS NOT 'coding' ORDER BY year DESC, month DESC, day DESC, user ASC;`
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
