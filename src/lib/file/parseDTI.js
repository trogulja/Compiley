'use strict';

// #region SetUp
const XLSX = require('xlsx');
const Datastore = require('nedb-promises');
const jobsAtomic = new Datastore();
const excelHelper = require('../util/excelHelper');
// #endregion

async function parseDTI(file, meta) {
  /**
   * file == {
   *   path: 'E:\\code\\Apps\\Compiley\\data\\test\\Slike 24_2018-01-01-09-05-13.xls',
   *   group: 'dti',
   *   name: '.\\test\\Slike 24_2018-01-01-09-05-13.xls',
   *   size: 10752,
   *   t_created: 1601152576391.5225,
   *   t_modified: 1601152576391.5225,
   *   t_parsed: 1601313389239
   * }
   */
  const wb = XLSX.readFile(file.path);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const sheet = XLSX.utils.sheet_to_json(ws);

  for (const row of sheet) {
    row.changeDate = excelHelper.date2ms(row.changeDate);
    row.lastRefreshed = excelHelper.date2ms(row.lastRefreshed);
    if (!row.fileHeaderName) row.fileHeaderName = 'nema imena';
    row.fileHeaderName = excelHelper.sanitizeString(row.fileHeaderName);
    row.refreshedBy = meta.metaUsers.dti[row.refreshedBy] ? meta.metaUsers.dti[row.refreshedBy] : 'xx_' + row.refreshedBy;

    let testing = true;
    if (testing) {
      let ok = false; // test if we missed some status lines on first set
      if (row.statusName == '-' && row.oldStatusId == 0) ok = true;
      if (row.statusName == '-nema' && row.oldStatusId == 1) ok = true;
      if (row.statusName == '1 - Pogledaj info' && row.oldStatusId == 2) ok = true;
      if (row.statusName == '2a-Kolor' && row.oldStatusId == 3) ok = true;
      if (row.statusName == '2b-Kolor Obrez' && row.oldStatusId == 4) ok = true;
      if (row.statusName == '2c-CB' && row.oldStatusId == 5) ok = true;
      if (row.statusName == '2d-CB Obrez' && row.oldStatusId == 1418) ok = true;
      if (row.statusName == '2e-Kolor kadriranje' && row.oldStatusId == 264048) ok = true;
      if (row.statusName == '2h-Korigirati' && row.oldStatusId == 1422) ok = true;
      if (row.statusName == '3-Spremno' && row.oldStatusId == 1419) ok = true;
      if (row.statusName == '3-Spremno (obrez)' && row.oldStatusId == 1420) ok = true;
      if (row.statusName == '3-Spremno Aut.' && row.oldStatusId == 1421) ok = true;
      if (row.statusName == '3A-M4-Proces' && row.oldStatusId == 1423) ok = true;
      if (row.statusName == '2g-Automatska obrada' && row.oldStatusId == 264049) ok = true;
      if (!ok) console.log(row);

      ok = false; // test if we missed some status lines on second set
      if (row.statusName_1 == '-' && row.newStatusId == 0) ok = true;
      if (row.statusName_1 == '-nema' && row.newStatusId == 1) ok = true;
      if (row.statusName_1 == '1 - Pogledaj info' && row.newStatusId == 2) ok = true;
      if (row.statusName_1 == '2a-Kolor' && row.newStatusId == 3) ok = true;
      if (row.statusName_1 == '2b-Kolor Obrez' && row.newStatusId == 4) ok = true;
      if (row.statusName_1 == '2c-CB' && row.newStatusId == 5) ok = true;
      if (row.statusName_1 == '2d-CB Obrez' && row.newStatusId == 1418) ok = true;
      if (row.statusName_1 == '2e-Kolor kadriranje' && row.newStatusId == 264048) ok = true;
      if (row.statusName_1 == '2h-Korigirati' && row.newStatusId == 1422) ok = true;
      if (row.statusName_1 == '3-Spremno' && row.newStatusId == 1419) ok = true;
      if (row.statusName_1 == '3-Spremno (obrez)' && row.newStatusId == 1420) ok = true;
      if (row.statusName_1 == '3-Spremno Aut.' && row.newStatusId == 1421) ok = true;
      if (row.statusName_1 == '3A-M4-Proces' && row.newStatusId == 1423) ok = true;
      if (row.statusName_1 == '2g-Automatska obrada' && row.newStatusId == 264049) ok = true;
      if (!ok) console.log(row);
    }

    if (row.newStatusId == 1419) {
      // '3-Spremno'
      await jobsAtomic
        .insert({
          type: 'standard',
          time: row.lastRefreshed,
          date: excelHelper.generateDate(row.lastRefreshed),
          hour: excelHelper.getHourInt(row.lastRefreshed),
          desk: row.deskName,
          source: source,
          user: row.refreshedBy,
          file: row.fileHeaderName,
        })
        .catch((e) => console.log(e));
    } else if (row.newStatusId == 1421) {
      // '3-Spremno Aut.'
      await db
        .insert({
          type: 'auto',
          time: row.lastRefreshed,
          date: generateDate(row.lastRefreshed),
          hour: getHourInt(row.lastRefreshed),
          desk: row.deskName,
          source: source,
          user: row.refreshedBy,
          file: row.fileHeaderName,
        })
        .catch((e) => console.log(e));
    } else if (row.newStatusId == 1423) {
      // '3A-M4-Proces'
      await m4status.insert({ time: row.changeDate, date: generateDate(row.lastRefreshed), hour: getHourInt(row.lastRefreshed), id: Number(row.id) }).catch((e) => console.log(e));
      // m4status.push({ time: row.changeDate, date: generateDate(row.lastRefreshed), id: Number(row.id) });
    } else if (row.newStatusId == 1420) {
      // '3-Spremno (obrez)'
      let startTime = await m4status
        .find({ id: Number(row.id) })
        .sort({ time: -1 })
        .exec()
        .then(async (doc) => {
          if (doc[0]) {
            let time = doc[0].time;
            await m4status.remove({ id: Number(doc[0].id) }, { multi: true });
            return time;
          } else {
            return false;
          }
        })
        .catch((e) => console.log(e));

      let type = 'cutout';
      let duration = startTime ? row.changeDate - startTime : 0; // If we don't have duration, set 0
      duration = Math.round(duration / 1000); // Convert duration from ms to s
      if (duration > 8 * 60 * 60) duration = 8 * 60 * 60; // Limit duration to 8h!
      if (row.oldStatusId != 1423) duration = -1; // TIBOR - ukoliko prethodni status nije M4-Process, prebaci u standardnu sliku!
      if (duration <= 0) type = 'Standard'; // If there is no time for cutout, we count that as Standard image!
      if (duration <= 0) duration = undefined; // If there is no time for cutout, we count that as Standard image!
      await dtidb
        .insert({
          type: type,
          time: row.lastRefreshed,
          date: generateDate(row.lastRefreshed),
          hour: getHourInt(row.lastRefreshed),
          desk: row.deskName,
          source: source,
          user: row.refreshedBy,
          file: row.fileHeaderName,
          duration: duration,
        })
        .catch((e) => console.log(e));
    }
  }
}

module.exports = parseDTI;
