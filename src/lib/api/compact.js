module.exports = async (req, res) => {
  console.log('received request!');
  try {
    res.send('Hello world!');
  } catch (error) {
    console.log('sending caused error');
    console.log(error)
  }
};
