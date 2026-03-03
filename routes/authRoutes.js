import express from "express";
import { registerUser, loginUser, logout } from "../controllers/authController.js";
// import auth from "../middleware/authMiddleware.js";
// import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
// router.get("/getUser/:id", auth, getUserInfo);
// router.put('/update', auth, upload.single('profile'), updateProfile);

router.get("/getbackend", (req, res) => {
    res.send({
        message: "get api from backend"
    });
});

export default router;