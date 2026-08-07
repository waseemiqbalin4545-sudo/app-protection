const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// JSON Parser
app.use(express.json());

// Manual CORS
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// Home
app.get("/", (req, res) => {
    res.send("App Protection Server Running Successfully");
});

// Status API
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Server Online"
    });
});

// Verify API
app.post("/api/verify", (req, res) => {

    const {
        api_key,
        package_name,
        android_id
    } = req.body;

    // API Key
    if (!api_key) {
        return res.json({
            success: false,
            message: "API Key Missing"
        });
    }

    if (api_key !== "GSMAASHI123") {
        return res.json({
            success: false,
            message: "Invalid API Key"
        });
    }

    // Package
    if (!package_name) {
        return res.json({
            success: false,
            message: "Package Name Missing"
        });
    }

    if (package_name !== "com.hbl.ml") {
        return res.json({
            success: false,
            message: "Invalid Package Name"
        });
    }

    // Android ID
    if (!android_id) {
        return res.json({
            success: false,
            message: "Android ID Missing"
        });
    }

    // Success
    return res.json({
        success: true,
        message: "Verification Successful",
        data: {
            package_name: package_name,
            android_id: android_id
        }
    });

});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Not Found"
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
