const axios = require('axios');

const instance = axios.create({
  // baseURL: 'http://localhost:8125/api/compiley',
  baseURL: 'http://srvczg-pamendo:8125/api/compiley',
});

class ParserlyAPI {
  getMeta() {
    return instance.get(`/meta`).then(
      (res) => Promise.resolve(res.data),
      (err) => Promise.reject(err.response.data)
    );
  }

  getData(yyyymm) {
    return instance.get(`/data/${yyyymm}`).then(
      (res) => Promise.resolve(res.data),
      (err) => Promise.reject(err.response.data)
    );
  }
}

exports['default'] = new ParserlyAPI();
