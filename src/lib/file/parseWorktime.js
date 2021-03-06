'use strict';

// #region SetUp
const XLSX = require('xlsx');
const eh = require('../util/excelHelper');
const tools = require('../db/tools');
const { setWith, get } = require('lodash');
// #endregion

async function parseWorktime(file, meta, db) {
  const source = tools.handleSource(file, 'worktime', meta, db);

  let wb, ws, sheet;
  try {
    wb = XLSX.readFile(file.path);
    ws = wb.Sheets[wb.SheetNames[0]];
    sheet = XLSX.utils.sheet_to_json(ws);
  } catch (error) {
    notifier.emit('error', `Unable to process file: ${file.path}, check for filters!`);
    console.log(error);
    return;
  }

  const workTimeRange1 = /.* (?<m>\d+)\/(?<d>\d+)\/(?<y>\d+) - (?<m2>\d+)\/(?<d2>\d+)\/(?<y2>\d+).*/;
  const workTimeRange2 = /.* (?<d>\d+)\.(?<m>\d+)\.(?<y>\d+)\. - (?<d2>\d+)\.(?<m2>\d+)\.(?<y2>\d+)\..*/;

  let razdoblje;
  try {
    razdoblje = Object.values(sheet[0])[0];
  } catch (error) {
    console.log(error);
    console.log(file.path);
    console.log(sheet[0]);
  }
  let frag;
  if (workTimeRange1.test(razdoblje)) frag = workTimeRange1.exec(razdoblje);
  if (workTimeRange2.test(razdoblje)) frag = workTimeRange2.exec(razdoblje);

  const dateStart = new Date(frag.groups.y, frag.groups.m - 1, frag.groups.d);
  const dateEnd = new Date(frag.groups.y2, frag.groups.m2 - 1, frag.groups.d2);
  const year = dateStart.getFullYear();
  const month = dateStart.getMonth();
  // console.log(razdoblje, dateStart.toDateString(), dateEnd.toDateString());

  const transactionWorktime = [];
  // console.log(sheet)
  for (const [index, row] of sheet.entries()) {
    const array = Object.values(row);
    if (array[0] !== 'Korisnik') continue;

    const user = meta.users.worktime[array[1]];
    if (!user) continue;

    if (!sheet[index + 1]) throw new Error('Malformed excel: trailing line 1');
    if (!sheet[index + 2]) throw new Error('Malformed excel: trailing line 2');
    const array2 = Object.values(sheet[index + 1]); // 3+ = days
    const array3 = Object.values(sheet[index + 2]); // 3+ = hours

    array2.splice(0, 3);
    array3.splice(0, 3);

    for (const [i, val] of array3.entries()) {
      const date = new Date(year, month, Number(array2[i])).getTime();
      const days = tools.handleDay(date, meta, db);
      const d_presence = eh.hour2s(val);
      transactionWorktime.push({ days, metaSource: source, metaUsers: user, d_presence });
    }
  }

  tools.insertTransactionWorktime(transactionWorktime, db);

  return true;
}

module.exports = parseWorktime;
