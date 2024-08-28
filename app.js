const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const http = require('http');
const socketio = require('socket.io');
require('dotenv').config();
const { handleMessageSend } = require('./controllers/messageController');
const bodyParser = require('body-parser');

// Middleware for CORS
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_KEY)
    .then(() => {
        console.log("DB CONNECT SUCCESS");
    })
    .catch(err => {
        console.error('DB connection error:', err);
    });

// Set up the server and Socket.IO
const PORT = process.env.PORT || 1000;
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    }
});

app.set('io', io);

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on("leaveRoom", (room) => {
        socket.leave(room);
        console.log(`User left room: ${room}`);
    });

    socket.on('sendMessage', (messageData) => {
        const { sender, receiver, message } = messageData;

        if (!sender || !receiver || !message) {
            console.error('Incomplete message data:', messageData);
            return;
        }

        const room = [sender, receiver].sort().join("_");
        io.to(room).emit("newMessage", messageData);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});


const mainRouter = require('./routers/mainRouter')(io);
app.use('/', mainRouter);

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
