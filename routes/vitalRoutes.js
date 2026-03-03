import express from "express";
import auth from "../middleware/authMiddleware.js";
import { addVital, getVitals, deleteVital } from "../controllers/vitalController.js";

const router = express.Router();

router.post("/add",      auth, addVital);
router.get("/list",      auth, getVitals);
router.delete("/:id",    auth, deleteVital);

export default router;