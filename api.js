const express = require('express')
const app = express()
const port = 8080
const bodyParser = require('body-parser');
const mainRouter = require("./routes/mainRouter.js");
const fn = require("./controllers/FnController.js");

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', mainRouter);
app.get('/push', fn.testPush);
app.listen(port, () => {
  console.log(`API listening on port ${port} process.version : ${process.version}`);
  fn.massLoop();
});

// обработка ошибки 404
app.use(function (req, res, next) {
  res.status(404).send("Data Not Found");
});