import express from "express";
import auth from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { uploadReport } from "../controllers/fileController.js";

const router = express.Router();

router.post(
  "/upload",
  auth,
  upload.single("file"),
  uploadReport
);

export default router;