function date2ms(d) {
  let date = new Date(Math.round((d - 25569) * 864e5));
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date.getTime();
}

function ms2date(d) {
  let date = new Date(d);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  d = date.getTime();
  return d / 864e5 + 25569;
}

function breakDate(d) {
  if (typeof d === 'number') d = new Date(d);
  // d.setHours(d.getHours() - 3); // Offset -3h to get same date range up to 3AM!
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() };
}

function generateDate(n) {
  function pad(n, width, z = '0') {
    n = String(n);
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
  let d = new Date(n);
  // d.setHours(d.getHours() - 3); // Offset -3h to get same date range up to 3AM!
  let yyyy = pad(d.getFullYear(), 4);
  let mm = pad(d.getMonth() + 1, 2);
  let dd = pad(d.getDate(), 2);
  let s = '' + yyyy + mm + dd;
  return parseInt(s);
}

function sanitizeString(str) {
  if (typeof str !== 'string') str = toString(str);
  str = str.replace(/[^a-z0-9 \.,_-]/gim, '');
  return str.trim();
}

module.exports = { date2ms, ms2date, generateDate, breakDate, sanitizeString };
