'use strict';

// #region SetUp
const XLSX = require('xlsx');
const eh = require('../util/excelHelper');
const tools = require('../db/tools');
const { setWith, get } = require('lodash');
// #endregion

async function parseParte(file, meta, db) {
  // const source = tools.handleSource(file, 'parte', meta, db)

  const wb = XLSX.readFile(file.path);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const sheet = XLSX.utils.sheet_to_json(ws, { header: ['id', 's1', 's2', 'user', 'time'] });

  let totalCheck = 0
  let totalSum
  for (const row of sheet) {
    if (!row.id) continue;
    if (typeof(row.id) !== 'number') continue;
    if (row.user === 'm4obrada') totalCheck += 1;
    if (row.user !== 'm4obrada') totalSum = row.id
  }

  // insert one new job per day, get id

  console.log(totalSum)
  if (totalCheck !== totalSum) console.log('mismatch in data!')
}

module.exports = parseParte;
