const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mainRouter = require('./routers/mainRouter');
const app = express();
const http = require('http');
const socketio = require('socket.io');
require('dotenv').config();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_KEY)
    .then(() => {
        console.log("DB CONNECT SUCCESS");
    }).catch(err => {
        console.log('error');
        console.log(err);
    })

app.use('/', mainRouter)




const PORT = 1000;
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:1000",
        credentials: true,
    }
})

io.on('connection', (socket) => {
    console.log('New WebSocket Connection');
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});