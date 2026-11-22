
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const queueRoutes = require("./routes/queueRoutes");
const counterRoutes = require("./routes/counterRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});
app.set("io", io);

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/counters", counterRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Campus Smart Queue API is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "Online",
    database: mongoose.connection.readyState === 1
      ? "Connected"
      : "Not connected",
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a student's personal room
  socket.on("join-student-room", (studentId) => {
    if (studentId) {
      socket.join(`student:${studentId}`);
      console.log(`Student joined room: ${studentId}`);
    }
  });

  // Join a counter's room
  socket.on("join-counter-room", (counterId) => {
    if (counterId) {
      socket.join(`counter:${counterId}`);
      console.log(`Counter joined room: ${counterId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB Connected Successfully!");
    } else {
      console.log("MongoDB URI not configured yet.");
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Campus Smart Queue running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
};

startServer();
