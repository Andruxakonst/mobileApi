const express = require("express");
const adsRouter = express.Router();
const Auth = require("../controllers/AuthController.js");
const Ads = require("../controllers/AdsController.js");

adsRouter.post("/list", Auth.authHeader, Ads.list);
adsRouter.get("/categories", Auth.authHeader, Ads.categories);

adsRouter.post("/create", Auth.authHeaderToken, Auth.auth, Ads.create);
adsRouter.post("/addmass", Auth.authHeaderToken, Auth.auth, Ads.addvip);
adsRouter.post("/vip", Auth.authHeaderToken, Auth.auth, Ads.vip);
adsRouter.post("/up", Auth.authHeaderToken, Auth.auth, Ads.up);

adsRouter.post("/turbo",Auth.authHeaderToken, Auth.auth, Ads.turbo);
adsRouter.get("/categorie", Auth.authHeader, Ads.categorie);

module.exports = adsRouter;