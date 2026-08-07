router.get("/test", async (req, res) => {
    req.body = {
        username: "admin",
        password: "admin123"
    };

    return authController.login(req, res);
});
