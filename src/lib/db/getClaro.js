const api = require('./parserly.service').default;
const tools = require('./tools');
const notifier = require('../util/notifier');
const extras = require('../util/extras');

const main = async (meta, db) => {
  const time = new Date().getTime();
  let parserlyMeta;
  try {
    parserlyMeta = await api.getMeta();
  } catch (error) {
    console.log(error);
    notifier.emit('info', 'Unable to contact Parserly! Check configuration.');
    return false;
  }
  const jobs = [];

  const insert = db.prepare(
    'INSERT OR IGNORE INTO helperClaro (type, timestamp, days, filename, channel, metaUsers, pstime, calctime, metaSource) VALUES (@type, @timestamp, @days, @filename, @channel, @metaUsers, @pstime, @calctime, @metaSource)'
  );
  const insertMany = db.transaction((claros) => {
    for (const claro of claros) insert.run(claro);
  });

  for (const pm of parserlyMeta) {
    const key = Object.keys(pm)[0];
    const name = `parserly/${key}`;
    const hash = pm[key];
    const id = meta.source.rev[name];

    if (!id) {
      // we never imported this before, do it now!
      jobs.push({ key, name, hash, id });
    } else {
      if (meta.source.all[id].hash !== hash) {
        // we have something new in the api, grab it!
        jobs.push({ key, name, hash, id });
      }
    }
  }

  for (const job of jobs) {
    let results;

    try {
      notifier.emit('info', `Grabbing data from parserly/${job.key}...`);
      results = await api.getData(job.key);
    } catch (error) {
      console.log(error);
      continue;
    }

    const size = extras.roughSizeOfObject(results);
    const metaSource = tools.handleSource({ name: job.name, size, hash: job.hash }, 'claro', meta, db);

    for (const result of results) {
      result.days = tools.handleDay(result.timestamp, meta, db);
      result.metaUsers = result.user ? meta.users.claro[result.user] : null;
      result.metaSource = metaSource;
    }

    insertMany(results);
  }

  notifier.emit('info', `Parserly data collected in ${Math.round((new Date().getTime() - time) / 1000)}s`);
  return true;
};

module.exports = main;
