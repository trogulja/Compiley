const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');
const { setWith } = require('lodash');

function getMeta(db) {
  const res = db.prepare('PRAGMA table_info("metaUsers")').all();
  if (!res.length) return false;

  // valid = ['dti', 'claro', 'easyjob', 'worktime', 'admin']
  const valid = res.map((el) => el.name).filter((el) => el !== 'id' && el !== 'name');
  valid.push('parte');
  // console.log(valid);
  // if (!valid.includes(s)) return false;

  const dbInfo = {
    jobs: {
      query: `SELECT id, product FROM metaJobs`,
      key: 'product',
      value: 'id',
    },
    types: {
      query: `SELECT id, name FROM metaTypes`,
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

  function getMetaJobs() {
    const result = db.prepare('SELECT * FROM metaJobs').all();
    const output = {};
    for (const res of result) {
      setWith(output, `["${res.client}"]["${res.product_group}"]["${res.product}"]`, res.id, Object);
    }
    return output;
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
    for (const res of result) {
      setWith(output, `[${res.year}][${res.month}][${res.day}]`, res.id, Object);
    }
    return output;
  }

  function getHelperPrintType() {
    return db.prepare('SELECT * FROM helperPrintType').all();
  }

  const jobs = getMetaJobs();
  const types = getFromDb('types');
  const users = getMetaUsers();
  const source = getMetaSource();
  const helperPrintType = getHelperPrintType();
  const days = getDays();

  return { users, jobs, types, source, days, validGroup: valid, helperPrintType };
}

module.exports = getMeta;
