const mongoose = require("mongoose");
const dns = require("dns");
const env = require("./env");

// Force Google DNS (helps when SRV lookups fail)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  mongoose.set("strictQuery", true);

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: env.NODE_ENV !== "production",
    });

    isConnected = true;
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`[db] MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("[db] MongoDB disconnected");
});

module.exports = connectDB;