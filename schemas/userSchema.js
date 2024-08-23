const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'message',
        default: []
    }]
});

const userDB = mongoose.model('users', userSchema);

module.exports = userDB;
