const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');

function checkDbTables(db) {
  db.pragma('journal_mode = WAL');

  const metaPrintTypes =
    'CREATE TABLE IF NOT EXISTS metaPrintTypes (id INTEGER PRIMARY KEY UNIQUE NOT NULL, type STRING, color_profile STRING);';
  const helperPrintType =
    'CREATE TABLE IF NOT EXISTS helperPrintType (id INTEGER PRIMARY KEY UNIQUE NOT NULL, product STRING, metaPrintTypes INTEGER REFERENCES metaPrintTypes (id) ON DELETE RESTRICT ON UPDATE CASCADE);';
  const metaUsers =
    'CREATE TABLE IF NOT EXISTS metaUsers (id INTEGER PRIMARY KEY NOT NULL UNIQUE, name STRING, dti STRING, claro STRING, easyjob STRING, worktime STRING, admin STRING);';
  const metaTypes =
    'CREATE TABLE IF NOT EXISTS metaTypes (id INTEGER PRIMARY KEY UNIQUE NOT NULL, [group] STRING, name STRING);';
  const metaSource =
    'CREATE TABLE IF NOT EXISTS metaSource (id INTEGER PRIMARY KEY UNIQUE NOT NULL, type STRING, name STRING, size INTEGER, hash STRING);';
  const metaJobs =
    'CREATE TABLE IF NOT EXISTS metaJobs (id INTEGER PRIMARY KEY UNIQUE NOT NULL, country STRING, client_group STRING, client STRING, product_group STRING, product STRING, metaPrintTypes STRING REFERENCES metaPrintTypes (id) ON DELETE RESTRICT ON UPDATE CASCADE, UNIQUE(client, product_group, product));';
  const days =
    'CREATE TABLE IF NOT EXISTS days (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, year INTEGER, month INTEGER, day INTEGER, timestamp INTEGER, sum_images INTEGER, sum_users INTEGER, sum_images_atomic INTEGER, sum_users_atomic INTEGER, sum_d_working INTEGER, sum_d_presence INTEGER);';
  const worktime =
    'CREATE TABLE IF NOT EXISTS worktime (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, days INTEGER REFERENCES days (id) ON DELETE CASCADE ON UPDATE CASCADE, metaSource INTEGER REFERENCES metaSource (id) ON DELETE CASCADE ON UPDATE CASCADE, metaUsers INTEGER REFERENCES metaUsers (id) ON DELETE RESTRICT ON UPDATE CASCADE, d_presence INTEGER, d_working INTEGER, UNIQUE(days, metaUsers));';
  const jobs =
    'CREATE TABLE IF NOT EXISTS jobs (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, days INTEGER REFERENCES days (id) ON DELETE CASCADE ON UPDATE CASCADE, metaJobs INTEGER REFERENCES metaJobs (id) ON DELETE RESTRICT ON UPDATE CASCADE, metaSource INTEGER REFERENCES metaSource (id) ON DELETE CASCADE ON UPDATE CASCADE, metaTypes INTEGER REFERENCES metaTypes (id) ON DELETE RESTRICT ON UPDATE CASCADE, metaUsers INTEGER REFERENCES metaUsers (id) ON DELETE RESTRICT ON UPDATE CASCADE, amount INTEGER, duration INTEGER, d_type INTEGER NOT NULL DEFAULT (0), UNIQUE(days, metaJobs, metaTypes, metaUsers));';
  const jobsAtomic =
    'CREATE TABLE IF NOT EXISTS jobsAtomic (id INTEGER UNIQUE ON CONFLICT IGNORE NOT NULL ON CONFLICT IGNORE PRIMARY KEY ON CONFLICT IGNORE, jobs INTEGER REFERENCES jobs (id) ON DELETE CASCADE ON UPDATE CASCADE, hour INTEGER, minute INTEGER, second INTEGER, duration INTEGER, d_type INTEGER NOT NULL DEFAULT (0), timestamp1 INTEGER, timestamp2 INTEGER, name STRING, UNIQUE(jobs, timestamp1, timestamp2, name));';
  const helperClaro =
    'CREATE TABLE IF NOT EXISTS helperClaro (id INTEGER PRIMARY KEY NOT NULL UNIQUE, type INTEGER, timestamp INTEGER, days INTEGER REFERENCES days (id) ON DELETE CASCADE ON UPDATE CASCADE, filename STRING, channel STRING, metaUsers INTEGER REFERENCES metaUsers (id) ON DELETE RESTRICT ON UPDATE CASCADE, pstime INTEGER, calctime INTEGER, processed BOOLEAN, metaSource INTEGER REFERENCES metaSource (id) ON DELETE CASCADE ON UPDATE CASCADE, UNIQUE(timestamp, filename, channel))';

  const table_check_order = [
    metaPrintTypes,
    helperPrintType,
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

  const table_indexes = [
    'CREATE INDEX IF NOT EXISTS helperClaroDaysIndex ON helperClaro ( days );',
    'CREATE INDEX IF NOT EXISTS helperClaroTypeIndex ON helperClaro ( type );',
    'CREATE INDEX IF NOT EXISTS jobsDaysIndex ON jobs ( days );',
    'CREATE INDEX IF NOT EXISTS worktimeDaysIndex ON worktime ( days );',
    'CREATE INDEX IF NOT EXISTS helperClaroFilenameIndex ON helperClaro ( filename );',
    'CREATE INDEX IF NOT EXISTS jobsAtomicNameIndex ON jobsAtomic ( name );',
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

  for (const index of table_indexes) {
    try {
      db.prepare(index).run();
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
      { id: 9, group: 'admin', name: 'briefing' },
      { id: 10, group: 'admin', name: 'project' },
      { id: 11, group: 'admin', name: 'coding' },
      { id: 12, group: 'admin', name: 'var' },
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
    helperPrintType: [
      { id: 1, metaPrintTypes: 3, product: '^Active ?Beauty.+$' },
      { id: 2, metaPrintTypes: 3, product: '^Antenne.+$' },
      { id: 3, metaPrintTypes: 1, product: '^Anzeigend+$' },
      { id: 4, metaPrintTypes: 1, product: '^Arbeit-d+$' },
      { id: 5, metaPrintTypes: 1, product: '^Bauer-d+-d+$' },
      { id: 6, metaPrintTypes: 1, product: '^Carinthischer Sommer d+$' },
      { id: 7, metaPrintTypes: 3, product: '^check.it.d+.d+$' },
      { id: 8, metaPrintTypes: 1, product: '^CirqueDuSoleil-d+$' },
      { id: 9, metaPrintTypes: 1, product: '^Citt.-Fierad+$' },
      { id: 10, metaPrintTypes: 3, product: '^Daseind+$' },
      { id: 11, metaPrintTypes: 3, product: '^DentalJournal.+$' },
      { id: 12, metaPrintTypes: 3, product: '^DieAssistentin.+$' },
      { id: 13, metaPrintTypes: 3, product: '^Diva.+$' },
      { id: 14, metaPrintTypes: 3, product: '^FreerideGuided+$' },
      { id: 15, metaPrintTypes: 1, product: '^Gady ?Ztg ?d+$' },
      { id: 16, metaPrintTypes: 1, product: '^Genussbeilage.+$' },
      { id: 17, metaPrintTypes: 1, product: '^Holdingd+$' },
      { id: 18, metaPrintTypes: 3, product: '^HUB_d+$' },
      { id: 19, metaPrintTypes: 3, product: '^Kärntner Monat .+$' },
      { id: 20, metaPrintTypes: 1, product: '^KirchenZTGd+$' },
      { id: 21, metaPrintTypes: 3, product: '^KiZ.+$' },
      { id: 22, metaPrintTypes: 1, product: '^Motorraum.+$' },
      { id: 23, metaPrintTypes: 1, product: '^Newspaperd+$' },
      { id: 24, metaPrintTypes: 1, product: '^Obersteiermark.+$' },
      { id: 25, metaPrintTypes: 3, product: '^ÖFB.?Corner.?d+$' },
      { id: 26, metaPrintTypes: 3, product: '^ParacelsusToday.d+$' },
      { id: 27, metaPrintTypes: 1, product: '^Presse.d+$' },
      { id: 28, metaPrintTypes: 1, product: '^Primus.?Ktn.?d+$' },
      { id: 29, metaPrintTypes: 3, product: '^ProHolz.+$' },
      { id: 30, metaPrintTypes: 3, product: '^Rapid .+$' },
      { id: 31, metaPrintTypes: 3, product: '^SPARMahlzeit.+$' },
      { id: 32, metaPrintTypes: 3, product: '^SPORTaktiv.+$' },
      { id: 33, metaPrintTypes: 3, product: '^VIA.d+.d+$' },
      { id: 34, metaPrintTypes: 3, product: '^Voest.?Alpine.+$' },
      { id: 35, metaPrintTypes: 3, product: '^Wienerin.+$' },
      { id: 36, metaPrintTypes: 2, product: '-REUTERS' },
      { id: 37, metaPrintTypes: 1, product: '24 Astral' },
      { id: 38, metaPrintTypes: 1, product: '24 Auto' },
      { id: 39, metaPrintTypes: 1, product: '24 Autostart' },
      { id: 40, metaPrintTypes: 1, product: '24 Bingo' },
      { id: 41, metaPrintTypes: 1, product: '24 Bingo MAX' },
      { id: 42, metaPrintTypes: 1, product: '24 Bingo mjesecnik' },
      { id: 43, metaPrintTypes: 1, product: '24 Bingo Plus' },
      { id: 44, metaPrintTypes: 1, product: '24 Bingo Specijal' },
      { id: 45, metaPrintTypes: 1, product: '24 BPI Zagreb' },
      { id: 46, metaPrintTypes: 3, product: '24 Budi.IN' },
      { id: 47, metaPrintTypes: 1, product: '24 BPI Zagreb' },
      { id: 48, metaPrintTypes: 1, product: '24 Cafe' },
      { id: 49, metaPrintTypes: 3, product: '24 Chic' },
      { id: 50, metaPrintTypes: 3, product: '24 Cool' },
      { id: 51, metaPrintTypes: 3, product: '24 Dizajn' },
      { id: 52, metaPrintTypes: 1, product: '24 Express' },
      { id: 53, metaPrintTypes: 1, product: '24 Galerija Epsova' },
      { id: 54, metaPrintTypes: 1, product: '24 Infografika' },
      { id: 55, metaPrintTypes: 1, product: '24 InOut' },
      { id: 56, metaPrintTypes: 1, product: '24 izbori' },
      { id: 57, metaPrintTypes: 3, product: '24 joomboos' },
      { id: 58, metaPrintTypes: 3, product: '24 Junior' },
      { id: 59, metaPrintTypes: 1, product: '24 Medijska' },
      { id: 60, metaPrintTypes: 1, product: '24 New graphics' },
      { id: 61, metaPrintTypes: 1, product: '24 News' },
      { id: 62, metaPrintTypes: 1, product: '24 oglasi' },
      { id: 63, metaPrintTypes: 3, product: '24 Ponos Hrvatske' },
      { id: 64, metaPrintTypes: 1, product: '24 Posebni prilozi' },
      { id: 65, metaPrintTypes: 3, product: '24 Posebni prilozi magazin' },
      { id: 66, metaPrintTypes: 1, product: '24 Posebni proizvodi - knjige' },
      { id: 67, metaPrintTypes: 1, product: '24 Predproizvod' },
      { id: 68, metaPrintTypes: 1, product: '24 Prva' },
      { id: 69, metaPrintTypes: 1, product: '24 Show' },
      { id: 70, metaPrintTypes: 1, product: '24 Skandi 111' },
      { id: 71, metaPrintTypes: 1, product: '24 Skandi 55' },
      { id: 72, metaPrintTypes: 1, product: '24 Skuhatcute' },
      { id: 73, metaPrintTypes: 1, product: '24 Sport' },
      { id: 74, metaPrintTypes: 1, product: '24 SuperSudoku' },
      { id: 75, metaPrintTypes: 1, product: '24 Tehno' },
      { id: 76, metaPrintTypes: 1, product: '24 TV' },
      { id: 77, metaPrintTypes: 1, product: '24 TV Tjedan' },
      { id: 78, metaPrintTypes: 1, product: '24 Zadnja' },
      { id: 79, metaPrintTypes: 1, product: '24 Zivot' },
      { id: 80, metaPrintTypes: 1, product: '7dnevno' },
      { id: 81, metaPrintTypes: 1, product: 'Arhiva VL' },
      { id: 82, metaPrintTypes: 1, product: 'Auto-moto VL' },
      { id: 83, metaPrintTypes: 3, product: 'Autozona RP' },
      { id: 84, metaPrintTypes: 3, product: 'Auto_magazin VL' },
      { id: 85, metaPrintTypes: 1, product: 'BiH VL' },
      { id: 86, metaPrintTypes: 1, product: 'Crna Kronika VL' },
      { id: 87, metaPrintTypes: 1, product: 'Debata VL' },
      { id: 88, metaPrintTypes: 1, product: 'Default Media' },
      { id: 89, metaPrintTypes: 3, product: 'Diva' },
      { id: 90, metaPrintTypes: 3, product: 'Diva VL' },
      { id: 91, metaPrintTypes: 1, product: 'Dnevnik' },
      { id: 92, metaPrintTypes: 1, product: 'Dom VL' },
      { id: 93, metaPrintTypes: 1, product: 'Ekran VL' },
      { id: 94, metaPrintTypes: 1, product: 'Enigmatika' },
      { id: 95, metaPrintTypes: 1, product: 'Ekskluziva VL' },
      { id: 96, metaPrintTypes: 3, product: 'Gourmet VL' },
      { id: 97, metaPrintTypes: 1, product: 'Grafika VL' },
      { id: 98, metaPrintTypes: 1, product: 'Infografika VL' },
      { id: 99, metaPrintTypes: 1, product: 'Ino VL' },
      { id: 100, metaPrintTypes: 1, product: 'Kompas VL' },
      { id: 101, metaPrintTypes: 1, product: 'Kultura VL' },
      { id: 102, metaPrintTypes: 3, product: 'Living VL' },
      { id: 103, metaPrintTypes: 3, product: 'Magazin PD' },
      { id: 104, metaPrintTypes: 1, product: 'Mali VL' },
      { id: 105, metaPrintTypes: 1, product: 'Max VL' },
      { id: 106, metaPrintTypes: 3, product: 'Moje Zdravlje VL' },
      { id: 107, metaPrintTypes: 1, product: 'Nedjelja VL' },
      { id: 108, metaPrintTypes: 1, product: 'New Graphics VL' },
      { id: 109, metaPrintTypes: 1, product: 'Njuškalo' },
      { id: 110, metaPrintTypes: 1, product: 'Obzor VL' },
      { id: 111, metaPrintTypes: 3, product: 'Ordinacija VL' },
      { id: 112, metaPrintTypes: 1, product: 'Panorama VL' },
      { id: 113, metaPrintTypes: 1, product: 'Parte' },
      { id: 114, metaPrintTypes: 1, product: 'Pecat BIH VL' },
      { id: 115, metaPrintTypes: 1, product: 'Posebni prilozi VL' },
      { id: 116, metaPrintTypes: 3, product: 'Posebni prilozi VL - magazin' },
      { id: 117, metaPrintTypes: 1, product: 'Posebni prilozi VL- novinski' },
      { id: 118, metaPrintTypes: 1, product: 'Posta RP' },
      { id: 119, metaPrintTypes: 1, product: 'Prva VL' },
      { id: 120, metaPrintTypes: 3, product: 'Putovanja VL' },
      { id: 121, metaPrintTypes: 1, product: 'Radar VL' },
      { id: 122, metaPrintTypes: 3, product: 'Radost VL' },
      { id: 123, metaPrintTypes: 1, product: 'RAZNO PD' },
      { id: 124, metaPrintTypes: 1, product: 'RAZNO VL' },
      { id: 125, metaPrintTypes: 1, product: 'Regije VL' },
      { id: 126, metaPrintTypes: 1, product: 'Scena VL' },
      { id: 127, metaPrintTypes: 1, product: 'ShareTZ' },
      { id: 128, metaPrintTypes: 3, product: 'Slano i Slatko VL' },
      { id: 129, metaPrintTypes: 1, product: 'Smart VL' },
      { id: 130, metaPrintTypes: 1, product: 'Sport VL' },
      { id: 131, metaPrintTypes: 3, product: 'Start' },
      { id: 132, metaPrintTypes: 1, product: 'Trash' },
      { id: 133, metaPrintTypes: 1, product: 'Turisticke stranice VL' },
      { id: 134, metaPrintTypes: 1, product: 'TV VL' },
      { id: 135, metaPrintTypes: 1, product: 'Unutrasnja VL' },
      { id: 136, metaPrintTypes: 1, product: 'Vojna povijest VL' },
      { id: 137, metaPrintTypes: 3, product: 'Voziona RP' },
      { id: 138, metaPrintTypes: 1, product: 'VP specijal VL' },
      { id: 139, metaPrintTypes: 1, product: 'Zadnja VL' },
      { id: 140, metaPrintTypes: 1, product: 'Zagreb VL' },
      { id: 141, metaPrintTypes: 3, product: 'Ballguide_stmk' },
      { id: 142, metaPrintTypes: 1, product: 'Barcolana Trieste' },
      { id: 143, metaPrintTypes: 1, product: 'DramatikerInnen' },
      { id: 144, metaPrintTypes: 1, product: 'E-Bike Kärnten' },
      { id: 145, metaPrintTypes: 1, product: 'Falkensteiner' },
      { id: 146, metaPrintTypes: 1, product: 'Feuerberg' },
      { id: 147, metaPrintTypes: 1, product: 'For Forest' },
      { id: 148, metaPrintTypes: 3, product: 'Fresh Conten Congress' },
      { id: 149, metaPrintTypes: 3, product: 'Fresh Content Congress ' },
      { id: 150, metaPrintTypes: 1, product: 'Genuss in Oesterreich' },
      { id: 151, metaPrintTypes: 3, product: 'GREENSTARt-Eventzeitung' },
      { id: 152, metaPrintTypes: 1, product: 'HumanomedBleibergerhof' },
      { id: 153, metaPrintTypes: 3, product: 'imTeam-Sept' },
      { id: 154, metaPrintTypes: 1, product: 'InnovationsmotorMobilitaet-0927' },
      { id: 155, metaPrintTypes: 1, product: 'Inserat-Elektro-Schutte' },
      { id: 156, metaPrintTypes: 1, product: 'Jobwahl-REGIONAL-KLZ' },
      { id: 157, metaPrintTypes: 3, product: 'Kabarettfruehling' },
      { id: 158, metaPrintTypes: 1, product: 'Kampagne-Nationalratswahl' },
      { id: 159, metaPrintTypes: 1, product: 'Kärnten Regional & Osttirol 0924' },
      { id: 160, metaPrintTypes: 3, product: 'Kärnten-Card-Broschüre-2019' },
      { id: 161, metaPrintTypes: 1, product: 'Kärntner Vorzeigebetriebe' },
      { id: 162, metaPrintTypes: 1, product: 'KL-08' },
      { id: 163, metaPrintTypes: 1, product: 'KLZ E-Bike Pass' },
      { id: 164, metaPrintTypes: 1, product: 'KrimifestivalWoerthersee0928' },
      { id: 165, metaPrintTypes: 1, product: 'ktn-vorzeigebetriebe' },
      { id: 166, metaPrintTypes: 1, product: 'KTN-Vorzeigebetriebe0820' },
      { id: 167, metaPrintTypes: 1, product: 'Kulinarik Beilage' },
      { id: 168, metaPrintTypes: 1, product: 'Kultursommer Beilagen' },
      { id: 169, metaPrintTypes: 1, product: 'Leselust0909' },
      { id: 170, metaPrintTypes: 1, product: 'Lust auf Kärnten' },
      { id: 171, metaPrintTypes: 3, product: 'MarketingReview19' },
      { id: 172, metaPrintTypes: 3, product: 'Miss-1019-205' },
      { id: 173, metaPrintTypes: 1, product: 'Newsletter-Banner' },
      { id: 174, metaPrintTypes: 1, product: 'Radherbst0809' },
      { id: 175, metaPrintTypes: 1, product: 'Reise-Newsletter' },
      { id: 176, metaPrintTypes: 3, product: 'SA-Bikeguide-19' },
      { id: 177, metaPrintTypes: 3, product: 'SA-Outdoorguide' },
      { id: 178, metaPrintTypes: 3, product: 'SkitourenGuide1003' },
      { id: 179, metaPrintTypes: 1, product: 'Styrian Skills' },
      { id: 180, metaPrintTypes: 1, product: 'Theaterland09' },
      { id: 181, metaPrintTypes: 1, product: 'Think-digital-CMS' },
      { id: 182, metaPrintTypes: 3, product: 'Think-digital-Kongress' },
      { id: 183, metaPrintTypes: 1, product: 'UniBibEroeffnung0919' },
      { id: 184, metaPrintTypes: 1, product: 'Veneto0915' },
      { id: 185, metaPrintTypes: 1, product: 'Volksschul-Fußballcup-2019' },
      { id: 186, metaPrintTypes: 1, product: 'Wien-Magazin-2019' },
      { id: 187, metaPrintTypes: 1, product: 'WinterKaerntenCard' },
      { id: 188, metaPrintTypes: 1, product: 'Wirtschaftsraum-1606' },
      { id: 189, metaPrintTypes: 1, product: 'Wohnbauförderung Journal' },
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
