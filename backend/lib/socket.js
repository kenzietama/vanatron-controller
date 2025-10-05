const {Server} = require("socket.io")
const http = require("http")
const express = require("express")

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://192.168.18.11:3000"]
    }
})

io.on("connection", socket => {
    console.log("A user connected", socket.id);

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
    })
})

// Fungsi untuk kirim notifikasi ke semua client
const sendNotification = (notification) => {
  io.emit("new-notification", notification);
};

module.exports = { io, app, server, sendNotification };
