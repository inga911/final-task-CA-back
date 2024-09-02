
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const io = require('socket.io');
const { handleMessageSend } = require('./messageController');


const userDB = require('../schemas/userSchema')
const messageDB = require('../schemas/messageSchema')
const conversationDB = require('../schemas/conversationSchema');

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
            res.send({ error: true, message: 'Error sending message', data: error.message });
        }
    },
    sendMessage: async (req, res) => {
        const { receiver, message, sender } = req.body;
        try {
            let conversation = await conversationDB.findOne({
                participants: { $all: [sender, receiver] }
            });

            const isNewConversation = !conversation;

            if (!conversation) {
                conversation = new conversationDB({
                    participants: [sender, receiver]
                });
                await conversation.save();
            }

            const newMessage = new messageDB({
                message,
                from: sender,
                to: receiver,
                conversationId: conversation._id,
                time: Date.now(),
            });

            await newMessage.save();

            conversation.lastMessage = newMessage.time;
            await conversation.save();

            if (isNewConversation) {
                io.emit("newConversation", { userId: receiver });
            }

            res.send({ error: false, message: "Message sent", data: newMessage });
        } catch (error) {
            res.send({ error: true, message: 'Error sending message', data: error.message });
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
            res.send({ error: true, message: 'Error fetching messages', data: error.message });
        }
    },
    // likeMessage: async (req, res) => {
    //     const { messageId } = req.params;
    //     const { userId } = req.body;

    //     if (!messageId) {
    //         return res.send({ error: true, message: 'Message ID is required' });
    //     }

    //     if (!userId) {
    //         return res.send({ error: true, message: 'User ID is required' });
    //     }

    //     try {
    //         const message = await messageDB.findById(messageId);
    //         if (!message) {
    //             return res.send({ error: true, message: 'Message not found' });
    //         }

    //         if (message.from === userId) {
    //             return res.send({ error: true, message: 'You cannot like your own message' });
    //         }

    //         if (message.liked && message.likedBy !== userId) {
    //             return res.send({ error: true, message: 'You cannot unlike a message liked by another user' });
    //         }

    //         message.liked = !message.liked;
    //         message.likedBy = message.liked ? userId : null;

    //         await message.save();

    //         io.emit('messageLiked', { messageId: message._id, liked: message.liked });

    //         res.send({ error: false, message: 'Message like status toggled', data: message });
    //     } catch (error) {
    //         res.send({ error: true, message: 'Internal server error' });
    //     }
    // },

    getActiveChats: async (req, res) => {
        const { userId } = req.params;

        if (!userId) {
            return res.send({ error: true, message: 'User ID is required' });
        }

        try {
            const messages = await messageDB.aggregate([
                {
                    $match: { // Filter messages that involve the current user 
                        $or: [{ from: userId }, { to: userId }]
                    }
                },
                {
                    $group: {//Group messages by unique pairs of users
                        _id: {
                            $cond: [ // Ensure user pairs are unique irrespective of their order.
                                { $gt: ["$from", "$to"] },
                                { from: "$to", to: "$from" },
                                { from: "$from", to: "$to" }
                            ]
                        },
                        lastMessage: { $last: "$$ROOT" }  // Get the last message in each conversation
                    }
                },
                {
                    $lookup: { // Join the users collection to get user details (username, image) for both from and to users.
                        from: "users",
                        localField: "_id.from",
                        foreignField: "username",
                        as: "fromUser"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.to",
                        foreignField: "username",
                        as: "toUser"
                    }
                },
                {
                    $project: { // Format the output to include necessary user details and conversation ID.
                        _id: 0,
                        conversationId: "$_id", // Include conversationId
                        conversation: {
                            $cond: [
                                { $eq: [userId, "$_id.from"] },
                                { username: { $arrayElemAt: ["$toUser.username", 0] }, image: { $arrayElemAt: ["$toUser.image", 0] } },
                                { username: { $arrayElemAt: ["$fromUser.username", 0] }, image: { $arrayElemAt: ["$fromUser.image", 0] } }
                            ]
                        },
                        lastMessageDate: "$lastMessage.time" // For sorting 
                    }
                },
                {
                    $sort: { lastMessageDate: -1 } // Sort by the last message date in descending order
                }
            ]);

            const activeChatsCount = messages.length;
            res.send({ error: false, message: 'Active chats retrieved', data: messages, count: activeChatsCount });
        } catch (error) {
            res.send({ error: true, message: 'Internal server error' });
        }
    },
    deleteConversation: async (req, res) => {
        const { userId1, userId2 } = req.params;

        if (!userId1 || !userId2) {
            return res.send({ error: true, message: 'Both user IDs are required' });
        }

        try {
            await messageDB.deleteMany({  // Delete all messages between the two users
                $or: [
                    { from: userId1, to: userId2 },
                    { from: userId2, to: userId1 }
                ]
            });

            io.emit("conversationDeleted", {
                userId: userId1,
            });
            io.emit("conversationDeleted", {
                userId: userId2,
            });
            res.send({ error: false, message: 'Conversation deleted successfully' });


        } catch (error) {
            console.error('Error deleting conversation:', error);
            res.send({ error: true, message: 'Internal server error' });
        }
    },
}


