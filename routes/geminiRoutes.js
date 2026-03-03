import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  analyzeReport,
  getInsight,
  getReportHistory,
  analyzeVitals,
  healthChat,
  getDashboard,
} from "../controllers/geminiController.js";

const router = express.Router();

router.post("/analyze-report/:fileId", auth, analyzeReport);
router.get("/insight/:fileId",         auth, getInsight);
router.get("/report-history",          auth, getReportHistory);
router.post("/analyze-vitals/:vitalId",auth, analyzeVitals);
router.post("/chat",                   auth, healthChat);
router.get("/dashboard",               auth, getDashboard);

export default router;