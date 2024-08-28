
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const io = require('socket.io');
const { handleMessageSend } = require('./messageController');


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
    login: async (req, res, io) => {
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
    updateImage: async (req, res, io) => {
        const { user, image } = req.body;

        if (!user || !user.id) {
            return res.send({ error: true, message: 'User ID is required', data: null });
        }

        if (!image) {
            return res.send({ error: true, message: 'Image URL is required', data: null });
        }

        try {
            const updatedUser = await userDB.findOneAndUpdate(
                { _id: user.id },
                { image },
                { new: true, projection: { password: 0 } }
            );

            if (!updatedUser) {
                return res.send({ error: true, message: 'User not found', data: null });
            }

            io.emit('profileImageUpdated', { userId: user.id, image: updatedUser.image });

            res.send({ error: false, message: "Image updated successfully", data: updatedUser });
        } catch (error) {
            console.error('Error updating image:', error);
            res.send({ error: true, message: 'Error updating image', data: error.message });
        }
    },
    updateUsername: async (req, res, io) => {
        const { username, user } = req.body;
        try {
            const existingUser = await userDB.findOne({ username: username });
            if (existingUser) {
                return res.send({ error: true, message: 'Username is already taken', data: null });
            }
            const updatedUser = await userDB.findOneAndUpdate(
                { _id: user.id },
                { $set: { username: username } },
                { new: true, projection: { password: 0 } }
            );

            if (!updatedUser) {
                return res.send({ error: true, message: 'User not found', data: null });
            }
            io.emit('usernameUpdated', { userId: user.id, username: updatedUser.username });
            res.send({ error: false, message: "Username updated successfully", data: updatedUser });
        } catch (error) {
            console.error("Error updating username:", error);
            res.send({ error: true, message: 'Error updating username', data: error.message });
        }
    },

    getAllUsers: async (req, res) => {
        const users = await userDB.find();
        res.send({ error: false, message: "success", data: users })
    },
    getUser: async (req, res) => {
        const { username } = req.params;
        const user = await userDB.findOne({ username }).select('-password');
        if (!user) {
            return res.send({ error: true, message: "User not found" });
        }

        res.send({ error: false, message: "success", data: user });
    },
    updatePassword: async (req, res) => {
        const { oldPassword, newPasswordOne, newPasswordTwo, user } = req.body;

        if (newPasswordOne !== newPasswordTwo) {
            return res.send({ error: true, message: 'New passwords do not match', data: null });
        }

        try {
            const foundUser = await userDB.findById(user.id);
            if (!foundUser) {
                return res.send({ error: true, message: 'User not found', data: null });
            }

            const isMatch = await bcrypt.compare(oldPassword, foundUser.password);
            if (!isMatch) {
                return res.send({ error: true, message: 'Old password is incorrect', data: null });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPasswordOne, salt);

            foundUser.password = hashedPassword;
            await foundUser.save();

            res.send({ error: false, message: 'Password updated successfully', data: null });
        } catch (error) {
            console.error('Error updating password:', error);
            res.send({ error: true, message: 'Error updating password', data: error.message });
        }
    },
    sendMessage: async (req, res) => {
        const { receiver, message, sender } = req.body;
        try {
            const io = req.app.get('io');
            const savedMessage = await handleMessageSend(io, { message, sender, receiver });
            res.send({ error: false, message: "Message sent", data: savedMessage });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send({ error: true, message: 'Error sending message', data: error.message });
        }
    },

    sendMessage: async (req, res) => {
        const { receiver, message, sender } = req.body;
        try {
            const senderUser = await userDB.findOne({ username: sender });
            if (!senderUser) {
                return res.status(404).send({ error: true, message: 'Sender not found', data: null });
            }

            const receiverUser = await userDB.findOne({ username: receiver });
            if (!receiverUser) {
                return res.status(404).send({ error: true, message: 'Receiver not found', data: null });
            }

            const newMessage = new messageDB({
                message,
                from: senderUser.username,
                to: receiverUser.username,
                time: Date.now(),
            });

            await newMessage.save();
            senderUser.messages.push(newMessage._id);
            receiverUser.messages.push(newMessage._id);
            await senderUser.save();
            await receiverUser.save();

            res.send({ error: false, message: "Message sent", data: newMessage });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send({ error: true, message: 'Error sending message', data: error.message });
        }
    },
    getMessages: async (req, res) => {
        const { sender, receiver } = req.params;
        try {
            const user = await userDB.findOne({ username: sender });
            if (!user) {
                return res.send({ error: true, message: 'User not found', data: null });
            }

            const messages = await messageDB.find({
                $or: [
                    { from: sender, to: receiver },
                    { from: receiver, to: sender }
                ]
            }).sort({ time: 1 });

            res.send({ error: false, message: "Messages retrieved", data: messages });
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.send({ error: true, message: 'Error fetching messages', data: error.message });
        }
    },
    likeMessage: async (req, res) => {
        const { messageId } = req.params;
        if (!messageId) {
            return res.status(400).send({ error: true, message: 'Message ID is required' });
        }

        try {
            const message = await messageDB.findById(messageId);
            if (!message) {
                return res.status(404).send({ error: true, message: 'Message not found' });
            }

            message.liked = !message.liked;
            await message.save();

            req.app.get('io').emit('messageLiked', { messageId: message._id, liked: message.liked });

            res.send({ error: false, message: 'Message like status toggled', data: message });
        } catch (error) {
            console.error('Error toggling like status:', error);
            res.status(500).send({ error: true, message: 'Internal server error' });
        }
    },
}


