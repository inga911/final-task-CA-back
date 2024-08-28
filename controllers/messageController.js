const io = require('socket.io');
const userDB = require('../schemas/userSchema');
const messageDB = require('../schemas/messageSchema');

async function handleMessageSend(io, messageData) {
    if (!messageData || !messageData.message || !messageData.sender || !messageData.receiver) {
        throw new Error('Message data is incomplete or undefined');
    }

    const { message, sender, receiver } = messageData;

    try {
        const senderUser = await userDB.findOne({ username: sender });
        const receiverUser = await userDB.findOne({ username: receiver });

        if (!senderUser) throw new Error('Sender not found');
        if (!receiverUser) throw new Error('Receiver not found');

        const newMessage = new messageDB({
            message,
            from: senderUser.username,
            to: receiverUser.username,
            time: Date.now(),
        });

        await newMessage.save();

        const room = [sender, receiver].sort().join("_");
        io.to(room).emit("newMessage", {
            message: newMessage.message,
            from: newMessage.from,
            to: newMessage.to,
            time: newMessage.time,
        });

        return newMessage;
    } catch (error) {
        console.error('Error handling message send:', error);
        throw error;
    }
}

module.exports = { handleMessageSend };