function calculateExpiry(hours) {
    const expire = new Date();
    expire.setHours(expire.getHours() + Number(hours));
    return expire;
}

function isExpired(expireTime) {
    if (!expireTime) return true;
    return new Date() > new Date(expireTime);
}

function remainingHours(expireTime) {
    if (!expireTime) return 0;

    const diff = new Date(expireTime) - new Date();

    if (diff <= 0) return 0;

    return Math.floor(diff / (1000 * 60 * 60));
}

module.exports = {
    calculateExpiry,
    isExpired,
    remainingHours
};
