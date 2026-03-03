import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import connectDb from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import fileRouter from "./routes/fileRoute.js";
import vitalsRouter from "./routes/vitalRoutes.js";
import geminiRouter from "./routes/geminiRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse FRONTEND_URL — supports comma-separated origins
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

connectDb();

const PORT = process.env.PORT || 8000;

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/files", fileRouter);
app.use("/api/vitals", vitalsRouter);
app.use("/api/ai", geminiRouter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => {
  console.log(`Server running on Port: ${PORT}`);
});