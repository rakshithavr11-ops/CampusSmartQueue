
const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5001";

// Test student room
const studentSocket = io(SERVER_URL);

// Test counter room
const counterSocket = io(SERVER_URL);

studentSocket.on("connect", () => {
  console.log("Student connected:", studentSocket.id);

  studentSocket.emit(
    "join-student-room",
    "6b0066cbc185286aa3e71074"
  );
});

counterSocket.on("connect", () => {
  console.log("Staff connected:", counterSocket.id);

  counterSocket.emit(
    "join-counter-room",
    "6b006e50389093d2dcdd44be"
  );
});

// Listen for real-time queue events
studentSocket.on("queue-updated", (data) => {
  console.log("\nSTUDENT RECEIVED UPDATE:");
  console.log(data);
});

counterSocket.on("queue-updated", (data) => {
  console.log("\nSTAFF RECEIVED UPDATE:");
  console.log(data);
});

studentSocket.on("connect_error", (error) => {
  console.log("Student connection error:", error.message);
});

counterSocket.on("connect_error", (error) => {
  console.log("Staff connection error:", error.message);
});

console.log("Waiting for real-time queue events...");
