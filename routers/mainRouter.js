const express = require('express');
const Router = express.Router();

const {
    register,
    login,
    updateImage,
    updateUsername,
    getAllUsers,
    getUser,
    updatePassword,
    sendMessage,
    getMessages,
    likeMessage
} = require('../controllers/mainController');

const {
    loginValidate,
    registerValidation,
    updateImgValidation,
    updateUsernameValidation,
    getUserValidation,
    updatePasswordValidation,
    sendMessageValidation,
} = require('../middleware/validators');

const authMiddle = require("../middleware/auth");

module.exports = (io) => {
    Router.post("/login", loginValidate, (req, res) => login(req, res, io));
    Router.post("/register", registerValidation, register);
    Router.post("/updateImage", authMiddle, updateImgValidation, (req, res) => updateImage(req, res, io));
    Router.post("/updateUsername", authMiddle, updateUsernameValidation, (req, res) => updateUsername(req, res, io));
    Router.post("/updatePassword", authMiddle, updatePasswordValidation, (req, res) => updatePassword(req, res, io));
    Router.get("/getAllUsers", getAllUsers);
    Router.get("/getUser/:username", getUserValidation, getUser);
    Router.post("/sendMessage", authMiddle, sendMessageValidation, sendMessage)
    Router.get("/getMessages/:sender/:receiver", getMessages);
    Router.post('/likeMessage/:messageId', likeMessage);



    return Router;
};
