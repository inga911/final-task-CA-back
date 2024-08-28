const hasUpperCase = /[A-Z]/;
const hasSpecialCharacter = /[!@#$%^&*_+?]/;
const hasNumber = /[0-9]/;
module.exports = {
    loginValidate: (req, res, next) => {
        const { username, password } = req.body
        if (!username) {
            return res.send({ error: true, message: 'Username not exists', data: null });
        }
        if (!password) {
            return res.send({ error: true, message: 'Passsword not exists', data: null });
        }
        if (username.length < 3 || username.length > 20) {
            console.log("Username validation failed");
            return res.send({ error: true, message: 'Username should be between 3 and 20 characters long', data: null });
        }
        if (password.length < 5) {
            console.log("Password length validation failed");
            return res.send({ error: true, message: 'Password should be at least 5 characters long', data: null });
        }
        next()
    },

    registerValidation: (req, res, next) => {
        const { username, passwordOne, passwordTwo } = req.body;

        if (!username) {
            return res.send({ error: true, message: 'Username not exists', data: null });
        }
        if (!passwordOne) {
            return res.send({ error: true, message: 'Passsword not exists', data: null });
        }
        if (!passwordTwo) {
            return res.send({ error: true, message: 'Passsword not exists', data: null });
        }
        if (username.length < 4 || username.length > 20) {
            return res.send({ error: true, message: 'Username should be between 4 and 20 characters long', data: null });
        }
        if (passwordOne.length < 4 || passwordOne.length > 20) {
            return res.send({ error: true, message: 'Password should be between 4 and 20 characters long', data: null });
        }
        if (passwordOne !== passwordTwo) {
            return res.send({ error: true, message: 'Passwords should match', data: null });
        }
        if (!hasUpperCase.test(passwordOne)) {
            return res.send({ error: true, message: 'Password must include at least one uppercase letter', data: null });
        }
        if (!hasSpecialCharacter.test(passwordOne)) {
            return res.send({ error: true, message: 'Password must include at least one special character (!@#$%^&*_+)', data: null });
        }
        if (!hasNumber.test(passwordOne)) {
            return res.send({ error: true, message: 'Password must include at least one number (0-9)', data: null });
        }
        next()
    },

    updatePasswordValidation: (req, res, next) => {
        const { oldPassword, newPasswordOne, newPasswordTwo } = req.body;

        if (!oldPassword || !newPasswordOne || !newPasswordTwo) {
            return res.send({ error: true, message: 'All password fields are required', data: null });
        }
        if (newPasswordOne !== newPasswordTwo) {
            return res.send({ error: true, message: 'Passwords do not match', data: null });
        }
        if (!hasUpperCase.test(newPasswordOne)) {
            return res.send({ error: true, message: 'Password must include at least one uppercase letter', data: null });
        }
        if (!hasSpecialCharacter.test(newPasswordOne)) {
            return res.send({ error: true, message: 'Password must include at least one special character (!@#$%^&*_+)', data: null });
        }
        if (!hasNumber.test(newPasswordOne)) {
            return res.send({ error: true, message: 'Password must include at least one number (0-9)', data: null });
        }
        next()
    },

    updateImgValidation: (req, res, next) => {
        const { image } = req.body;

        if (!image) {
            return res.send({ error: true, message: 'Image URL is required', data: null });
        }

        const urlPattern = /^(https?:\/\/)[^\s$.?#].[^\s]*$/;
        if (!urlPattern.test(image)) {
            return res.send({ error: true, message: 'Image URL invalid', data: null });
        }
        next();
    },


    updateUsernameValidation: (req, res, next) => {
        const { username } = req.body;
        if (!username) {
            return res.send({ error: true, message: 'Username are required', data: null });
        }
        if (username.length < 3 || username.length > 20) {
            console.log("Username validation failed");
            return res.send({ error: true, message: 'Username should be between 3 and 20 characters long', data: null });
        }
        next();

    },

    getUserValidation: (req, res, next) => {
        const { username } = req.params;
        if (!username) {
            return res.send({ error: true, message: 'Username is required', data: null });
        }
        if (username.length < 3 || username.length > 20) {
            return res.send({ error: true, message: 'Username should be between 3 and 20 characters long', data: null });
        }
        next()
    },

    sendMessageValidation: (req, res, next) => {
        const { message } = req.body;
        if (message.length < 3 || message.length > 100) {
            return res.send({ error: true, message: 'Message should be between 3 and 100 characters long', data: null });
        }
        next();
    },
};