const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');
const { setWith } = require('lodash');

function getMeta() {
  const db = new Database(paths.database);
  const checkdb = checkDbTables();
  if (!checkdb) return false;

  const res = db.prepare('PRAGMA table_info("metaUsers")').all();
  if (!res.length) return false;

  // valid = ['dti', 'claro', 'easyjob', 'worktime', 'admin']
  const valid = res.map((el) => el.name).filter((el) => el !== 'id' && el !== 'name');
  // console.log(valid);
  // if (!valid.includes(s)) return false;

  function checkDbTables() {
    db.pragma('journal_mode = WAL');
    db.prepare(
      'CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY NOT NULL, cID STRING, root STRING, type STRING, profile STRING, name STRING, todoNew INT, todoTaken INT, done INT, dueMS INT, updatedAtMS INT)'
    ).run();

    const helperPrintTypeRegex =
      'CREATE TABLE IF NOT EXISTS helperPrintTypeRegex (id INTEGER PRIMARY KEY UNIQUE NOT NULL, job_name_regex STRING, metaPrintTypes INTEGER REFERENCES metaPrintTypes (id) ON DELETE RESTRICT ON UPDATE CASCADE);';
    const metaPrintTypes =
      'CREATE TABLE IF NOT EXISTS metaPrintTypes (id INTEGER PRIMARY KEY UNIQUE NOT NULL, type STRING, color_profile STRING);';
    const metaUsers =
      'CREATE TABLE IF NOT EXISTS metaUsers (id INTEGER PRIMARY KEY NOT NULL UNIQUE, name STRING, dti STRING, claro STRING, easyjob STRING, worktime STRING, admin STRING);';
    const metaTypes =
      'CREATE TABLE IF NOT EXISTS metaTypes (id INTEGER PRIMARY KEY UNIQUE NOT NULL, [group] STRING, name STRING);';
    const metaSource =
      'CREATE TABLE IF NOT EXISTS metaSource (id INTEGER PRIMARY KEY UNIQUE NOT NULL, type STRING, name STRING, size INTEGER, t_created INTEGER, t_modified INTEGER, t_parsed INTEGER);';
    const metaJobs =
      'CREATE TABLE IF NOT EXISTS metaJobs (id INTEGER PRIMARY KEY UNIQUE NOT NULL, country STRING, client_group STRING, client STRING, product_group STRING, product STRING UNIQUE ON CONFLICT IGNORE, metaPrintTypes STRING REFERENCES metaPrintTypes (id) ON DELETE RESTRICT ON UPDATE CASCADE);';
    const days =
      'CREATE TABLE IF NOT EXISTS days (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, year INTEGER, month INTEGER, day INTEGER, timestamp INTEGER, sum_images INTEGER, sum_users INTEGER, sum_images_atomic INTEGER, sum_users_atomic INTEGER, sum_d_working INTEGER, sum_d_presence INTEGER);';
    const worktime =
      'CREATE TABLE IF NOT EXISTS worktime (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, days INTEGER REFERENCES days (id) ON DELETE CASCADE ON UPDATE CASCADE, metaSource INTEGER REFERENCES metaSource (id) ON DELETE CASCADE ON UPDATE CASCADE, metaUsers INTEGER REFERENCES metaUsers (id) ON DELETE RESTRICT ON UPDATE CASCADE, d_presence INTEGER, d_working INTEGER);';
    const jobs =
      'CREATE TABLE IF NOT EXISTS jobs (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, days INTEGER REFERENCES days (id) ON DELETE CASCADE ON UPDATE CASCADE, metaJobs INTEGER REFERENCES metaJobs (id) ON DELETE RESTRICT ON UPDATE CASCADE, metaSource INTEGER REFERENCES metaSource (id) ON DELETE CASCADE ON UPDATE CASCADE, metaTypes INTEGER REFERENCES metaTypes (id) ON DELETE RESTRICT ON UPDATE CASCADE, metaUsers INTEGER REFERENCES metaUsers (id) ON DELETE RESTRICT ON UPDATE CASCADE, amount INTEGER, duration INTEGER, d_type INTEGER NOT NULL DEFAULT (0));';
    const jobsAtomic =
      'CREATE TABLE IF NOT EXISTS jobsAtomic (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, jobs INTEGER REFERENCES jobs (id) ON DELETE CASCADE ON UPDATE CASCADE, hour INTEGER, minute INTEGER, second INTEGER, duration INTEGER, d_type INTEGER NOT NULL DEFAULT (0));';

    const table_check_order = [
      helperPrintTypeRegex,
      metaPrintTypes,
      metaUsers,
      metaTypes,
      metaSource,
      metaJobs,
      days,
      worktime,
      jobs,
      jobsAtomic,
    ];

    let output = true;
    for (const table of table_check_order) {
      try {
        db.prepare(table).run();
      } catch (error) {
        console.log(error);
        output = false;
        continue;
      }
    }

    return output;
  }

  const dbInfo = {
    jobs: {
      query: `SELECT id, product FROM metaJobs`,
      key: 'product',
      value: 'id',
    },
    types: {
      query: `SELECT id, name FROM metaTypes WHERE 'group' = 'images'`,
      key: 'name',
      value: 'id',
    },
  };
  function getFromDb(t) {
    if (!dbInfo[t]) return false;
    const x = dbInfo[t];
    const result = {};
    db.prepare(x.query)
      .all()
      .forEach((el) => {
        result[el[x.key]] = el[x.value];
      });
    return result;
  }

  function getMetaSource() {
    const all = {};
    const rev = {};
    const result = db.prepare('SELECT * FROM metaSource').all();
    result.forEach((el) => {
      rev[el.name] = el.id;
      all[el.id] = {
        group: el.group,
        name: el.name,
        size: el.size,
        t_created: el.t_created,
        t_modified: el.t_modified,
        t_parsed: el.t_parsed,
      };
    });
    return { rev, all };
  }

  function getMetaUsers() {
    const result = db.prepare('SELECT * FROM metaUsers').all();
    const output = {};
    valid.forEach((el) => {
      output[el] = {};
      result.forEach((el2) => {
        output[el][el2[el]] = el2.id;
      });
    });
    return output;
  }

  function getDays() {
    const result = db.prepare('SELECT * FROM days').all();
    const output = {};
    for (const res in result) {
      setWith(output, `[${res.year}][${res.month}][${res.day}]`, res.id, Object);
    }
    return output;
  }

  const jobs = getFromDb('jobs');
  const types = getFromDb('types');
  const users = getMetaUsers();
  const source = getMetaSource();
  const days = getDays();

  db.close();
  return { users, jobs, types, source, days, validGroup: valid };
}

module.exports = getMeta;
