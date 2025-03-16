const express = require('express');
const app = express();
const http = require("http");
const {Server} = require("socket.io");
const cors = require("cors");

app.use(cors()); //middleware

// Use the correct middleware to parse incoming text
app.use(express.text()); 

const server = http.createServer(app)

//instanciate a new socket.io class
const io = new Server(server, {
    cors: {
        origin: "*",
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

// Handle connection detection event from ESP32
app.post("/connection", (req, res) => {
    io.emit("connectionDetected", { message: "Connection positive", address: req.body });
    console.log("connection coming from", req.body) 
    res.send({ address: req.body });
});

// Handle connection detection event from ESP32
app.post("/connection-finish", (req, res) => {
    io.emit("connectionFinished", { message: "Connection lost", address: req.body });
    console.log("connection lost of", req.body) 
    res.send({ address: req.body });
});

// Handle motion detection event from ESP32
app.post("/motion", (req, res) => {
    io.emit("motionDetected", { message: "Alert", address: req.body });
    console.log("Unidentified object detected from", req.body)
    res.send({ address_triggered: req.body });
})

// Handle motion detection event from ESP32
app.post("/motion-finish", (req, res) => {
    io.emit("motionFinished", { message: "Alert stopped", address: req.body });
    console.log("Unidentified object detected from", req.body)
    res.send({ address_removed: req.body });
})

app.get("/test", (req, res) => {
    console.log("test")
    res.send({ status: "received" });
})

server.listen(3001, "0.0.0.0", () => {
    console.log("Server is running on port 3001");
});