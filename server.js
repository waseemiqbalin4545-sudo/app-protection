require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/db");

const authRoutes = require("./routes/auth");
const appRoutes = require("./routes/apps");
const deviceRoutes = require("./routes/devices");
const verifyRoutes = require("./routes/verify");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

app.use(cors());
app.use(express.json());

/*
 Database Test
*/
db.query("SELECT NOW()")
.then(() => {
    console.log("✅ PostgreSQL Connected");
})
.catch((err) => {
    console.log(err);
});

/*
 Home
*/
app.get("/", (req, res) => {
    res.json({
        success: true,
        project: "App Protection API",
        version: "3.0",
        database: "Connected"
    });
});

/*
 Health
*/
app.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "online"
    });
});

/*
 Routes
*/
app.use("/api/auth", authRoutes);
app.use("/api/apps", appRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/dashboard", dashboardRoutes);

/*
 404
*/
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Not Found"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server Running On Port " + PORT);
});
