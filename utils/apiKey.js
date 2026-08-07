const crypto = require("crypto");

function generateApiKey(length = 32) {
    return crypto.randomBytes(length).toString("hex");
}

function generateAppSecret(length = 64) {
    return crypto.randomBytes(length).toString("hex");
}

function validateApiKey(apiKey) {
    if (!apiKey) return false;

    return /^[a-f0-9]{64}$/i.test(apiKey);
}

module.exports = {
    generateApiKey,
    generateAppSecret,
    validateApiKey
};
