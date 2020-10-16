const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');

function checkDbTables(db) {
  db.pragma('journal_mode = WAL');

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
    'CREATE TABLE IF NOT EXISTS worktime (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, days INTEGER REFERENCES days (id) ON DELETE CASCADE ON UPDATE CASCADE, metaSource INTEGER REFERENCES metaSource (id) ON DELETE CASCADE ON UPDATE CASCADE, metaUsers INTEGER REFERENCES metaUsers (id) ON DELETE RESTRICT ON UPDATE CASCADE, d_presence INTEGER, d_working INTEGER, UNIQUE(days, metaUsers));';
  const jobs =
    'CREATE TABLE IF NOT EXISTS jobs (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, days INTEGER REFERENCES days (id) ON DELETE CASCADE ON UPDATE CASCADE, metaJobs INTEGER REFERENCES metaJobs (id) ON DELETE RESTRICT ON UPDATE CASCADE, metaSource INTEGER REFERENCES metaSource (id) ON DELETE CASCADE ON UPDATE CASCADE, metaTypes INTEGER REFERENCES metaTypes (id) ON DELETE RESTRICT ON UPDATE CASCADE, metaUsers INTEGER REFERENCES metaUsers (id) ON DELETE RESTRICT ON UPDATE CASCADE, amount INTEGER, duration INTEGER, d_type INTEGER NOT NULL DEFAULT (0), UNIQUE(days, metaJobs, metaTypes, metaUsers));';
  const jobsAtomic =
    'CREATE TABLE IF NOT EXISTS jobsAtomic (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, jobs INTEGER REFERENCES jobs (id) ON DELETE CASCADE ON UPDATE CASCADE, hour INTEGER, minute INTEGER, second INTEGER, duration INTEGER, d_type INTEGER NOT NULL DEFAULT (0), timestamp1 INTEGER, timestamp2 INTEGER, name STRING, UNIQUE(jobs, timestamp1, timestamp2, name));';
  const helperClaro =
    'CREATE TABLE IF NOT EXISTS helperClaro (id INTEGER PRIMARY KEY NOT NULL UNIQUE, type INTEGER, timestamp INTEGER, days INTEGER REFERENCES days (id) ON DELETE CASCADE ON UPDATE CASCADE, filename STRING, channel STRING, metaUsers INTEGER REFERENCES metaUsers (id) ON DELETE RESTRICT ON UPDATE CASCADE, pstime INTEGER, calctime INTEGER, processed BOOLEAN, UNIQUE(timestamp, filename, channel))';

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
    helperClaro,
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

function checkDbTableContent(db) {
  const test = {
    metaUsers: [
      {
        id: 1,
        name: 'Dejan Barlek',
        dti: 'BARLEKDE',
        claro: 'barlekde',
        easyjob: 'Dejan Barlek',
        worktime: 'Barlek Dejan',
        admin: 'Dejan Barlek',
      },
      {
        id: 2,
        name: 'Krešimir Bikić',
        dti: 'BIKICKRE',
        claro: 'bikickre',
        easyjob: 'Krešimir Bikic',
        worktime: 'Bikić Krešimir',
        admin: 'Krešimir Bikić',
      },
      {
        id: 3,
        name: 'Tomislav Čar',
        dti: 'CARTOMIS',
        claro: 'cartomis',
        easyjob: 'Tomislav Car',
        worktime: 'Čar Tomislav',
        admin: 'Tomislav Čar',
      },
      {
        id: 4,
        name: 'Majda Desnica',
        dti: 'DESNICMA',
        claro: 'desnicma',
        easyjob: 'Majda Desnica',
        worktime: 'Desnica Majda',
        admin: 'Majda Desnica',
      },
      {
        id: 5,
        name: 'Silvija Krajcar',
        dti: 'KRAJCASI',
        claro: 'krajcasi',
        easyjob: 'Silvija Krajcar',
        worktime: 'Krajcar Silvija',
        admin: 'Silvija Krajcar',
      },
      {
        id: 6,
        name: 'Dejan Kumpar',
        dti: 'KUMPARDE',
        claro: 'kumparde',
        easyjob: 'Dejan Kumpar',
        worktime: 'Kumpar Dejan',
        admin: 'Dejan Kumpar',
      },
      {
        id: 7,
        name: 'Andrea Levak',
        dti: 'LEVAKAND',
        claro: 'levakand',
        easyjob: 'Andrea Levak',
        worktime: 'Levak Andrea',
        admin: 'Andrea Levak',
      },
      {
        id: 8,
        name: 'Božica Preberina Olah',
        dti: 'PREBERBO',
        claro: 'preberbo',
        easyjob: 'Olah Božica Preberina',
        worktime: 'Preberina Olah Božica',
        admin: 'Božica Preberina Olah',
      },
      {
        id: 9,
        name: 'Tibor Rogulja',
        dti: 'ROGULJTI',
        claro: 'roguljti',
        easyjob: 'Tibor Rogulja',
        worktime: 'Rogulj Tibor',
        admin: 'Tibor Rogulja',
      },
      {
        id: 10,
        name: 'Nataša Sečki',
        dti: 'SECKINAT',
        claro: 'seckinat',
        easyjob: 'Nataša Secki',
        worktime: 'Sečki Nataša',
        admin: 'Nataša Sečki',
      },
      {
        id: 11,
        name: 'Karlo Toth',
        dti: 'TOTHKARL',
        claro: 'tothkarl',
        easyjob: 'Karlo Toth',
        worktime: 'Toth Karlo',
        admin: 'Karlo Toth',
      },
      {
        id: 12,
        name: 'Ivana Vuković',
        dti: 'VUKOVIIV',
        claro: 'vukoviiv',
        easyjob: 'Ivana Vukovic',
        worktime: 'Vuković Ivana',
        admin: 'Ivana Vuković',
      },
      {
        id: 13,
        name: 'Jasmina Alihodžić',
        dti: 'ALIHODJA',
        claro: 'alihodja',
        easyjob: 'Jasmina Alihodžic',
        worktime: 'Jasmina Alihodžić',
        admin: 'Jasmina Alihodžić',
      },
      {
        id: 14,
        name: 'Nina Varga',
        dti: 'VARGANIN',
        claro: 'varganin',
        easyjob: 'Nina Varga',
        worktime: 'Nina Varga',
        admin: 'Nina Varga',
      },
      {
        id: 15,
        name: 'Ivana Kos',
        dti: 'KOSIVANA',
        claro: 'kosivana',
        easyjob: 'Ivana Kos',
        worktime: 'Ivana Kos',
        admin: 'Ivana Kos',
      },
    ],
    metaTypes: [
      { id: 1, group: 'image', name: 'standard' },
      { id: 2, group: 'image', name: 'montage' },
      { id: 3, group: 'image', name: 'cutout' },
      { id: 4, group: 'image', name: 'halfauto' },
      { id: 5, group: 'image', name: 'halfauto_cutout' },
      { id: 6, group: 'image', name: 'auto' },
      { id: 7, group: 'image', name: 'auto_cutout' },
      { id: 8, group: 'image', name: 'parte' },
    ],
    metaPrintTypes: [
      { id: 1, type: 'coldset', color_profile: 'Unknown' },
      { id: 2, type: 'coldset+', color_profile: 'Unknown' },
      { id: 3, type: 'heatset', color_profile: 'Unknown' },
      { id: 4, type: 'coldset', color_profile: 'Newspaper Coldset v4' },
      { id: 5, type: 'coldset+', color_profile: 'Newspaper Coldset v4' },
      { id: 6, type: 'coldset', color_profile: 'Newspaper Coldset v5' },
      { id: 7, type: 'heatset', color_profile: 'ISO Coated v2 300' },
      { id: 8, type: 'heatset', color_profile: 'PSO Coated v3' },
      { id: 9, type: 'heatset', color_profile: 'PSO LWC Improved' },
      { id: 10, type: 'heatset', color_profile: 'PSO Uncoated' },
    ],
    helperPrintTypeRegex: [
      { id: 1, metaPrintTypes: 3, job_name_regex: '^Active ?Beauty.+$' },
      { id: 2, metaPrintTypes: 3, job_name_regex: '^Antenne.+$' },
      { id: 3, metaPrintTypes: 1, job_name_regex: '^Anzeigend+$' },
      { id: 4, metaPrintTypes: 1, job_name_regex: '^Arbeit-d+$' },
      { id: 5, metaPrintTypes: 1, job_name_regex: '^Bauer-d+-d+$' },
      { id: 6, metaPrintTypes: 1, job_name_regex: '^Carinthischer Sommer d+$' },
      { id: 7, metaPrintTypes: 3, job_name_regex: '^check.it.d+.d+$' },
      { id: 8, metaPrintTypes: 1, job_name_regex: '^CirqueDuSoleil-d+$' },
      { id: 9, metaPrintTypes: 1, job_name_regex: '^Citt.-Fierad+$' },
      { id: 10, metaPrintTypes: 3, job_name_regex: '^Daseind+$' },
      { id: 11, metaPrintTypes: 3, job_name_regex: '^DentalJournal.+$' },
      { id: 12, metaPrintTypes: 3, job_name_regex: '^DieAssistentin.+$' },
      { id: 13, metaPrintTypes: 3, job_name_regex: '^Diva.+$' },
      { id: 14, metaPrintTypes: 3, job_name_regex: '^FreerideGuided+$' },
      { id: 15, metaPrintTypes: 1, job_name_regex: '^Gady ?Ztg ?d+$' },
      { id: 16, metaPrintTypes: 1, job_name_regex: '^Genussbeilage.+$' },
      { id: 17, metaPrintTypes: 1, job_name_regex: '^Holdingd+$' },
      { id: 18, metaPrintTypes: 3, job_name_regex: '^HUB_d+$' },
      { id: 19, metaPrintTypes: 3, job_name_regex: '^Kärntner Monat .+$' },
      { id: 20, metaPrintTypes: 1, job_name_regex: '^KirchenZTGd+$' },
      { id: 21, metaPrintTypes: 3, job_name_regex: '^KiZ.+$' },
      { id: 22, metaPrintTypes: 1, job_name_regex: '^Motorraum.+$' },
      { id: 23, metaPrintTypes: 1, job_name_regex: '^Newspaperd+$' },
      { id: 24, metaPrintTypes: 1, job_name_regex: '^Obersteiermark.+$' },
      { id: 25, metaPrintTypes: 3, job_name_regex: '^ÖFB.?Corner.?d+$' },
      { id: 26, metaPrintTypes: 3, job_name_regex: '^ParacelsusToday.d+$' },
      { id: 27, metaPrintTypes: 1, job_name_regex: '^Presse.d+$' },
      { id: 28, metaPrintTypes: 1, job_name_regex: '^Primus.?Ktn.?d+$' },
      { id: 29, metaPrintTypes: 3, job_name_regex: '^ProHolz.+$' },
      { id: 30, metaPrintTypes: 3, job_name_regex: '^Rapid .+$' },
      { id: 31, metaPrintTypes: 3, job_name_regex: '^SPARMahlzeit.+$' },
      { id: 32, metaPrintTypes: 3, job_name_regex: '^SPORTaktiv.+$' },
      { id: 33, metaPrintTypes: 3, job_name_regex: '^VIA.d+.d+$' },
      { id: 34, metaPrintTypes: 3, job_name_regex: '^Voest.?Alpine.+$' },
      { id: 35, metaPrintTypes: 3, job_name_regex: '^Wienerin.+$' },
    ],
  };
  function generateInsert(t) {
    let o1 = '';
    let o2 = '';
    for (const name in test[t][0]) {
      if (o1 === '') o1 = `[${name}]`;
      else o1 = `${o1}, [${name}]`;
      if (o2 === '') o2 = `@${name}`;
      else o2 = `${o2}, @${name}`;
    }
    return `INSERT INTO ${t} (${o1}) VALUES (${o2})`;
  }

  for (const t in test) {
    const check = db.prepare(`SELECT count(*) AS i FROM ${t}`).get();
    const drop = db.prepare(`DELETE FROM ${t}`);
    const target = test[t].length;
    const insert = db.prepare(generateInsert(t));
    const insertAll = db.transaction((items) => {
      for (const item of items) insert.run(item);
    });
    if (check.i !== target) {
      if (check.i !== 0) drop.run();
      insertAll(test[t]);
    }
  }

  return true;
}

function main() {
  const db = new Database(paths.database);
  const checkdb = checkDbTables(db);
  if (!checkdb) {
    db.close();
    return false;
  }

  checkDbTableContent(db);

  return db;
}

module.exports = main;
