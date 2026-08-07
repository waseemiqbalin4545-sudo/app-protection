const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("App Protection Server Running Successfully");
});

app.get("/api/status", (req, res) => {
    res.json({
        status: true,
        message: "Server is Online"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
