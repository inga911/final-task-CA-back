
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
        if (username.length < 3 || username.length > 20) {
            return res.send({ error: true, message: 'Username should be between 3 and 20 characters long', data: null });
        }
        if (passwordOne.length < 5) {
            return res.send({ error: true, message: 'Password should be at least 5 characters long', data: null });
        }
        if (passwordOne !== passwordTwo) {
            return res.send({ error: true, message: 'Passwords should match', data: null });
        }
        next()
    },

}