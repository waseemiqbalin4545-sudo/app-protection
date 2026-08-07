const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Test
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

  // API KEY
  if (api_key !== "GSMAASHI123") {
    return res.json({
      success: false,
      message: "Invalid API Key"
    });
  }

  // Package
  if (package_name !== "com.hbl.ml") {
    return res.json({
      success: false,
      message: "Invalid Package"
    });
  }

  // Android ID
  if (!android_id) {
    return res.json({
      success: false,
      message: "Android ID Missing"
    });
  }

  return res.json({
    success: true,
    message: "Verification Successful",
    data: {
      package_name,
      android_id
    }
  });

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
