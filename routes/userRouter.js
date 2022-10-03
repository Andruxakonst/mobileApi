const express = require("express");
const userRouter = express.Router();
const Auth = require("../controllers/AuthController.js");
const User = require("../controllers/UserController.js");

userRouter.get("/balance",Auth.authHeaderToken, User.user_balance);
userRouter.post("/reg",  Auth.authHeader, User.reg);
userRouter.post("/activate", Auth.authHeaderToken, User.activ);
userRouter.post("/edit", Auth.authHeaderToken, User.user_edit);
userRouter.post("/login", Auth.authHeader, User.user_get);
userRouter.get("/getMagazin", Auth.authHeaderId, User.getMagazin);
userRouter.post("/order", Auth.authHeaderToken, User.order);
userRouter.post("/sale", Auth.authHeaderToken, User.sale);
userRouter.post("/favorite", Auth.authHeaderToken, User.favorite);
userRouter.post("/favorite_get", Auth.authHeaderToken, User.favorite_get);
userRouter.post("/add_review", Auth.authHeaderToken, User.add_review);
userRouter.post("/my_review", Auth.authHeaderToken, User.my_review);
userRouter.post("/del", Auth.authHeaderToken, User.del);
userRouter.post("/stat", Auth.authHeaderToken, User.stat);
userRouter.post("/set_push_id", Auth.authHeaderToken, User.setPushId);

module.exports = userRouter;