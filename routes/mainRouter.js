const express = require("express");
const mainRouter = express.Router();

const Auth = require("../controllers/AuthController.js");

const chatRouter = require("./chatRouter.js");
const adsRouter = require("./adsRouter.js");
const userRouter = require("./userRouter.js");
const directRouter = require("./directRouter.js");

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../docs/swagger.json');

mainRouter.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
mainRouter.use("/ads", adsRouter);
mainRouter.use("/user", userRouter);
mainRouter.use("/chat", Auth.authHeaderToken, chatRouter);
mainRouter.use("/direct", Auth.authHeader, directRouter);

//АУКЦИОН создать \получить
// mainRouter.get("/user/chat", Auth.authHeaderToken, User.chart);
// mainRouter.post("/user/chat", Auth.authHeaderToken, User.chart);



module.exports = mainRouter;