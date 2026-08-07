const jwt = require("../utils/jwt");

module.exports = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization token missing"
            });
        }

        const token = authHeader.replace("Bearer ", "");

        const user = jwt.verifyToken(token);

        req.user = user;

        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid or Expired Token"
        });

    }
};
