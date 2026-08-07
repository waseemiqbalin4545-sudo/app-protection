const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "gsm_aashi_super_secret";

function generateToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: admin.role
    },
    SECRET,
    {
      expiresIn: "7d"
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = {
  generateToken,
  verifyToken
};
