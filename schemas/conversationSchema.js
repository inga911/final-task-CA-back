const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    participants: {
        type: [String],
        required: true,
        validate: v => v.length === 2
    },
    lastMessage: {
        type: Date,
        default: Date.now
    }
}, { collection: 'conversations' });

const conversationDB = mongoose.model('conversation', conversationSchema);

module.exports = conversationDB;
