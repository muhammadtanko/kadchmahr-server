require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectMongo = require("./connections/mongo.conn");
const { appPort } = require("./config");

const userRoutes = require("./routes/user.routes");
const leaveRoutes = require("./routes/leave.routes");
const requestRoutes = require("./routes/request.route");
const accountRoutes = require("./routes/account.route");
const transactionRoutes = require("./routes/transaction.route");
const analyticsRoutes = require("./routes/analytics.route");
const meetingRoutes = require("./routes/meeting.route");
const notificationRoutes = require("./routes/notification.routes");
const activityRoutes = require("./routes/activity.routes");
const payrollRoutes = require("./routes/payroll.route");
const memoRoutes = require("./routes/memo.route");
const documentRoutes = require("./routes/document.route");
const folderRoutes = require("./routes/folder.route");
const embedRoutes = require("./routes/embed.route");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => res.json({ ok: true, message: "KADCHMA Backend API v1" }));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/leave", leaveRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/accounts", accountRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/payroll", payrollRoutes);
app.use("/api/v1/memos", memoRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/folders", folderRoutes);
app.use("/api/v1/embed", embedRoutes);

app.use((req, res) => res.status(404).json({ ok: false, message: "Route not found" }));

connectMongo().then(() => {
    app.listen(appPort, () => {
        console.log(`KADCHMA Backend running on port ${appPort}`);
    });
});
