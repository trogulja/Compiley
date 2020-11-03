module.exports = {
  transpileDependencies: [],
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      externals: ['better-sqlite3']
    }
  }
};
