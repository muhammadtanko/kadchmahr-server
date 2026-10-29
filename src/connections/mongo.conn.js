const mongoose = require("mongoose");
const { mongoURI } = require("../config");

module.exports = async () => {
    const dbConn = mongoose.connection;
    dbConn
        .on("connected", () => console.log("MongoDB connected"))
        .on("error", (err) => console.error("MongoDB error:", err.message))
        .on("disconnected", () => {
            console.log("MongoDB disconnected — reconnecting in 5s");
            setTimeout(() => mongoose.connect(mongoURI), 5000);
        });
    await mongoose.connect(mongoURI);
};
