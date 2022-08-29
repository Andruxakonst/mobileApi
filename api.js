const express = require('express')
const app = express()
const request = require('request')
const port = 80
const bodyParser = require('body-parser');
const mainRouter = require("./routes/mainRouter.js");

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', mainRouter);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

// обработка ошибки 404
app.use(function (req, res, next) {
  res.status(404).send("Data Not Found");
});