const notifier = require('../util/notifier');

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  notifier.emit('info', `New connection from ${ip === '::1' ? 'localhost' : ip} requesting compact data.`)
  // console.log(req);
  try {
    res.send('Hello world!');
  } catch (error) {
    console.log('sending caused error');
    console.log(error)
  }
};
