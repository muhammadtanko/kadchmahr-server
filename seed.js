require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { mongoURI } = require("./src/config");

// Convert MongoDB Extended JSON to plain JS objects
function convertExtendedJSON(value) {
    if (Array.isArray(value)) return value.map(convertExtendedJSON);
    if (value !== null && typeof value === "object") {
        if ("$oid" in value) return new mongoose.Types.ObjectId(value.$oid);
        if ("$date" in value) {
            const d = value.$date;
            if (typeof d === "string") return new Date(d);
            if (typeof d === "object" && "$numberLong" in d) return new Date(parseInt(d.$numberLong));
            if (typeof d === "number") return new Date(d);
        }
        if ("$numberLong" in value) return parseInt(value.$numberLong);
        if ("$numberInt" in value) return parseInt(value.$numberInt);
        if ("$numberDouble" in value) return parseFloat(value.$numberDouble);
        const result = {};
        for (const [k, v] of Object.entries(value)) result[k] = convertExtendedJSON(v);
        return result;
    }
    return value;
}

async function seed() {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        const raw = fs.readFileSync(path.join(__dirname, "test.users.json"), "utf8");
        const parsed = JSON.parse(raw);
        const users = convertExtendedJSON(parsed);

        const db = mongoose.connection.db;
        const collection = db.collection("users");

        const before = await collection.countDocuments();
        await collection.deleteMany({});
        console.log(`Cleared ${before} existing user(s)`);

        const result = await collection.insertMany(users, { ordered: false });
        console.log(`Inserted ${result.insertedCount} user(s) from test.users.json`);

        await mongoose.disconnect();
        console.log("Done. Disconnected.");
    } catch (err) {
        console.error("Seed failed:", err.message);
        process.exit(1);
    }
}

seed();
