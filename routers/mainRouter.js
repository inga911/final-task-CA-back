const express = require('express');
const Router = express.Router();

const {
    register,
    login,

} = require('../controllers/mainController');

const {
    loginValidate,
    registerValidation,
} = require('../middleware/validators')

const authMiddle = require("../middleware/auth")


Router.post("/login", loginValidate, login)
Router.post("/register", registerValidation, register)



module.exports = Router