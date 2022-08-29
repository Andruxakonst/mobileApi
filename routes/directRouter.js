const express = require("express");
const directrRouter = express.Router();
const Direct = require("../controllers/DirectController.js");

directrRouter.get("/country", Direct.country);
directrRouter.get("/region", Direct.region);
directrRouter.get("/city", Direct.city);
directrRouter.get("/metro", Direct.metro);

module.exports = directrRouter;