const express = require("express");
const adsRouter = express.Router();
const Auth = require("../controllers/AuthController.js");
const Ads = require("../controllers/AdsController.js");

adsRouter.post("/list" ,Ads.list);

adsRouter.post("/AddMass", Auth.authHeaderToken, Auth.auth, Ads.addAds);
adsRouter.post("/vip", Auth.authHeaderToken, Auth.auth, Ads.vip);
adsRouter.post("/up", Auth.authHeaderToken, Auth.auth, Ads.up);

adsRouter.post("/turbo",Auth.authHeaderToken, Auth.auth, Ads.turbo);
adsRouter.get("/categories", Auth.authHeader, Ads.categories);
adsRouter.get("/categorie", Auth.authHeader, Ads.categorie);

module.exports = adsRouter;