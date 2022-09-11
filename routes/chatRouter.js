const express = require("express");
const chatRouter = express.Router();
const Chat = require("../controllers/ChatController.js");

chatRouter.post("/init", Chat.init);
chatRouter.post("/load", Chat.load);
chatRouter.post("/delete", Chat.delete);
chatRouter.post("/count", Chat.count_message);
chatRouter.post("/send", Chat.send);
chatRouter.post("/user_locked", Chat.user_locked);

module.exports = chatRouter;