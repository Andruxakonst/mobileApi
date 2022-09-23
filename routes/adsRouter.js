const express = require("express");
const adsRouter = express.Router();
const Auth = require("../controllers/AuthController.js");
const Ads = require("../controllers/AdsController.js");
const multer = require('multer');
const helpers = require('../helpers/helperImage');

adsRouter.post("/list", Auth.authHeader, Ads.list);
adsRouter.get("/categories", Auth.authHeader, Ads.categories);
adsRouter.post("/create", multer().any(), Auth.authHeaderToken, Auth.auth, Ads.create);
adsRouter.post("/update", multer().any(), Auth.authHeaderToken, Auth.auth, Ads.update);
adsRouter.post("/addmass", Auth.authHeaderToken, Auth.auth, Ads.addvip);
adsRouter.post("/vip", Auth.authHeaderToken, Auth.auth, Ads.vip);
adsRouter.post("/up", Auth.authHeaderToken, Auth.auth, Ads.up);
adsRouter.post("/turbo",Auth.authHeaderToken, Auth.auth, Ads.turbo);
adsRouter.get("/category", Auth.authHeader, Ads.category);

module.exports = adsRouter;