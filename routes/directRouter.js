const express = require("express");
const directrRouter = express.Router();
const Direct = require("../controllers/DirectController.js");

directrRouter.get("/country", Direct.country);
directrRouter.get("/region", Direct.region);
directrRouter.get("/city", Direct.city);
directrRouter.get("/metro", Direct.metro);

directrRouter.get("/support", Direct.support);
directrRouter.get("/secur", Direct.secur);
directrRouter.get("/tutor", Direct.tutor);

module.exports = directrRouter;