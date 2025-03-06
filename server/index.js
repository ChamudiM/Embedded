const express = require('express');
const app = express();
const http = require("http");
const {Server} = require("socket.io");
const cors = require("cors");

app.use(cors()); //middleware

const server = http.createServer(app)


//instanciate a new socket.io class
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) =>{
    console.log("a user connected", socket.id);
    
    socket.on("join_room", (data) => {
        socket.join(data);
    });

    socket.on("send_message", (data) => {
         socket.to(data.room).emit("receive_message", data);
    });
});

server.listen(3001, () => {
    console.log("Server is running on port 3001");

});