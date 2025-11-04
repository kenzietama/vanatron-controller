const {Server} = require("socket.io")
const http = require("http")
const express = require("express")
const { sendPushNotification } = require("./push")

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://vanatron.kenzietama.site", "https://dev.kenzietama.site"],
        credentials: true,
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
    Promise.resolve(sendPushNotification(notification)).catch((error) => {
        console.error("Failed to dispatch push notification", error.message);
    });
};

module.exports = { io, app, server, sendNotification };
