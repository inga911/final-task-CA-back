const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        default: Date.now,
    },
    liked: {
        type: Boolean,
        default: false
    },
    likedBy: {
        type: String,
        default: null,
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'conversation'
    }
}, { collection: 'messages' });

const messageDB = mongoose.model('message', messageSchema);

module.exports = messageDB;
