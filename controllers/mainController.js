
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userDB = require('../schemas/userSchema')
const messageDB = require('../schemas/messageSchema')

module.exports = {
    register: async (req, res) => {
        const { username, passwordOne: password } = req.body;

        const existingUser = await userDB.findOne({ username });
        if (existingUser) {
            return res.send({ error: true, message: 'Username is already taken', data: null });
        }

        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, salt)

        const newUser = new userDB({
            username,
            password: passwordHash,
        });

        await newUser.save();

        const users = await userDB.find();
        if (users) {
            res.send({ error: false, message: "success", data: users });
        } else {
            res.send({ error: true, message: 'Error registering user', data: null });
        }
    },
    login: async (req, res) => {
        const { username, password } = req.body;
        try {

            const user = await userDB.findOne({ username });
            if (!user) {
                return res.send({ error: true, message: 'Invalid username or password', data: null });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.send({ error: true, message: 'Invalid username or password', data: null });
            } else {
                const data = {
                    id: user._id,
                    username: user.username,
                    image: user.image
                };
                const token = jwt.sign(data, process.env.JWT_SECRET);
                res.send({ error: false, message: 'Login successful', data: { token, user: { ...data } } });
            }
        } catch (error) {
            console.error('Error logging in:', error);
            res.send({ error: true, message: 'Error logging in', data: error.message });
        }
    },

}

