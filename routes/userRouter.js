const express = require("express");
const userRouter = express.Router();
const Auth = require("../controllers/AuthController.js");
const User = require("../controllers/UserController.js");

userRouter.get("/balance",Auth.authHeaderToken, User.user_balance);
userRouter.post("/reg",  Auth.authHeader, User.reg);
userRouter.post("/edit", Auth.authHeaderToken, User.user_edit);
userRouter.post("/login", Auth.authHeader, User.user_get);
userRouter.get("/getMagazin", Auth.authHeaderId, User.getMagazin);
userRouter.get("/order", Auth.authHeaderToken, User.order);
userRouter.get("/sale", Auth.authHeaderToken, User.sale);
userRouter.post("/favorite", Auth.authHeaderToken, User.favorite);
userRouter.post("/add_review", Auth.authHeaderToken, User.add_review);
userRouter.post("/del_review", Auth.authHeaderToken, User.del_review);

module.exports = userRouter;