require("dotenv").config();
const express = require("express");
const { connectToDB } = require("./configs/db");
const http = require("http");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const conversationRoute = require("./routes/conversationRoute");
const messageRoute = require("./routes/messageRoute");
const groupRoute = require("./routes/groupRoute");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const initializeSocket = require("./utils/socket");
const PORT = process.env.PORT || 7771;

const app = express();
const server = http.createServer(app);
initializeSocket(server);
// --- Middlewares ---
app.use(
  cors({
    origin: ["http://10.10.15.171:5173", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// --- Routes ---
app.use("/", authRoute);
app.use("/user", userRoute);
app.use("/", conversationRoute);
app.use("/", messageRoute);
app.use("/", groupRoute);

// --- Connect to DB and start server ---
(async () => {
  try {
    await connectToDB(); // connect first
    server.listen(PORT, () => console.log("Server running on port ", PORT));
  } catch (err) {
    console.error("Failed to connect to DB:", err);
    process.exit(1); // exit process on failure
  }
})();

// Helpful error reporting for common server issues
server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Set PORT to a free port or stop the process using it.`
    );
  } else {
    console.error("Server error:", err);
  }
});
