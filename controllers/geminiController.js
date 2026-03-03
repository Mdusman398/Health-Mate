import geminiModel from "../config/gemini.js";
import { AiInsight } from "../models/AiInsight.js";
import { File } from "../models/file.js";
import { Vital } from "../models/Vital.js";
import axios from "axios";

const isHealthRelated = (text) => {
  const kws = [
    "blood","sugar","pressure","weight","report","test","result","doctor",
    "medicine","symptom","disease","health","pain","fever","glucose",
    "cholesterol","hemoglobin","urine","bp","bmi","diet","food","remedy",
    "vitamin","infection","lab","analysis","vital","heart","kidney","liver",
    "thyroid","diabetes","hypertension","anemia","oxygen","pulse",
  ];
  return kws.some((k) => text.toLowerCase().includes(k));
};


const toBase64 = async (url) => {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data).toString("base64");
};

// ─── 1. Analyze Report (PDF / image) ─────────────────────────────────────────
export const analyzeReport = async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).send({ message: "File not found" });
    if (file.user.toString() !== req.user._id.toString())
      return res.status(403).send({ message: "Unauthorized" });

    const base64 = await toBase64(file.fileUrl);
    const mimeType = file.fileUrl.toLowerCase().includes(".pdf")
      ? "application/pdf"
      : "image/jpeg";

    const prompt = `
You are HealthMate AI — a medical report assistant.
Analyze the provided health report and respond ONLY in this exact JSON format. No extra text outside JSON.

{
  "englishSummary": "3-5 sentence plain English explanation for a non-medical person.",
  "urduSummary": "Roman Urdu mein 3-4 sentences — is report ki simple wazahat jo aam aadmi samajh sake.",
  "abnormalValues": ["Each abnormal value like: 'Hemoglobin: 9.2 g/dL (Low — Normal: 12-16)'"],
  "doctorQuestions": ["3-5 questions patient should ask their doctor"],
  "foodSuggestions": ["4-6 food recommendations based on findings"],
  "homeRemedies": ["3-5 safe lifestyle or home remedy tips"],
  "disclaimer": "This AI analysis is for educational purposes only and does not replace professional medical advice. Consult a qualified doctor."
}

If not a medical report: {"error": "Not a valid medical report."}
`;

    const result = await geminiModel.generateContent([
      { inlineData: { mimeType, data: base64 } },
      { text: prompt },
    ]);

    const cleaned = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.error) return res.status(400).send({ message: parsed.error });

    const insight = await AiInsight.findOneAndUpdate(
      { file: req.params.fileId },
      {
        file: req.params.fileId,
        englishSummary:  parsed.englishSummary,
        urduSummary:     parsed.urduSummary,
        abnoramalValues: parsed.abnormalValues,
        doctorQuestions: parsed.doctorQuestions,
        foodSuggestions: parsed.foodSuggestions,
        homeRemedies:    parsed.homeRemedies,
        disclaimer:      parsed.disclaimer,
      },
      { upsert: true, new: true }
    ).populate("file");

    res.status(200).send({ message: "Report analyzed successfully", insight });
  } catch (err) {
    console.error("analyzeReport error:", err);
    res.status(500).send({ message: "Analysis failed", error: err.message });
  }
};

// ─── 2. Get saved insight for one file ────────────────────────────────────────
export const getInsight = async (req, res) => {
  try {
    const insight = await AiInsight.findOne({ file: req.params.fileId }).populate("file");
    // Return null insight gracefully — frontend will show "Analyze" button
    res.status(200).send({ insight: insight || null });
  } catch (err) {
    res.status(500).send({ message: "Error fetching insight", error: err.message });
  }
};

// ─── 3. Report History — ALL user files + their insight if available ──────────
//  THIS is the key fix: fetch Files first, attach insight where it exists
export const getReportHistory = async (req, res) => {
  try {
    // Get all files uploaded by this user
    const files = await File.find({ user: req.user._id }).sort({ createdAt: -1 });

    // For each file, find its insight (may be null)
    const insights = await Promise.all(
      files.map(async (file) => {
        const insight = await AiInsight.findOne({ file: file._id }).lean();
        return {
          _id:              insight?._id || file._id,
          file:             file,
          englishSummary:   insight?.englishSummary  || null,
          urduSummary:      insight?.urduSummary     || null,
          abnoramalValues:  insight?.abnoramalValues || [],
          doctorQuestions:  insight?.doctorQuestions || [],
          foodSuggestions:  insight?.foodSuggestions || [],
          homeRemedies:     insight?.homeRemedies    || [],
          disclaimer:       insight?.disclaimer      || null,
          analyzed:         !!insight,
        };
      })
    );

    res.status(200).send({ insights });
  } catch (err) {
    res.status(500).send({ message: "Error fetching report history", error: err.message });
  }
};

// ─── 4. Vital Analysis ────────────────────────────────────────────────────────
export const analyzeVitals = async (req, res) => {
  try {
    const vital = await Vital.findById(req.params.vitalId);
    if (!vital) return res.status(404).send({ message: "Vital not found" });
    if (vital.user.toString() !== req.user._id.toString())
      return res.status(403).send({ message: "Unauthorized" });

    const prompt = `
You are HealthMate AI. Analyze these health vitals and respond ONLY in this exact JSON format. No extra text.

Vitals:
- Blood Pressure: ${vital.bp}
- Blood Sugar: ${vital.sugar} mg/dL
- Weight: ${vital.weight} kg
- Date: ${vital.date}
- Notes: ${vital.notes || "None"}

{
  "summary": "2-4 sentence plain English + Roman Urdu mix analysis. Example: 'Your blood pressure is normal. Aapka blood pressure normal hai.'",
  "foodSuggestions": ["4-5 food suggestions based on vitals"],
  "homeRemedies": ["3-4 lifestyle tips or home remedies"],
  "disclaimer": "This is for educational purposes only. Consult a doctor for medical advice."
}
`;

    const result = await geminiModel.generateContent(prompt);
    const cleaned = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).send({ message: "Vital analysis complete", analysis: parsed });
  } catch (err) {
    console.error("analyzeVitals error:", err);
    res.status(500).send({ message: "Vital analysis failed", error: err.message });
  }
};

// ─── 5. Health Chat ───────────────────────────────────────────────────────────
export const healthChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).send({ message: "Message required" });

    if (!isHealthRelated(message)) {
      return res.status(200).send({
        reply: "I can only help with health-related questions. Please ask about your reports, symptoms, vitals, or general health topics.\n\n(Main sirf sehat se mutalliq sawaalon ka jawab de sakta hoon. Apni report, symptoms ya vitals ke baare mein poochhein.)",
      });
    }

    const prompt = `
You are HealthMate AI — a friendly health assistant.
Answer this health question clearly. Respond in English first, then add a brief Roman Urdu explanation to help the user understand better.
Always end with a short disclaimer.

Question: "${message}"

Format:
[English answer — 2-4 sentences]

Roman Urdu: [same answer in Roman Urdu — 1-3 sentences]

Disclaimer: This is for educational purposes only. Please consult a doctor for medical advice.
`;

    const result = await geminiModel.generateContent(prompt);
    res.status(200).send({ reply: result.response.text() });
  } catch (err) {
    console.error("healthChat error:", err);
    res.status(500).send({ message: "Chat failed", error: err.message });
  }
};

// ─── 6. Dashboard ─────────────────────────────────────────────────────────────
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalReports, totalVitals, latestVital, latestFile] = await Promise.all([
      File.countDocuments({ user: userId }),
      Vital.countDocuments({ user: userId }),
      Vital.findOne({ user: userId }).sort({ date: -1 }),
      File.findOne({ user: userId }).sort({ createdAt: -1 }),
    ]);

    // Latest insight (if any)
    let latestInsight = null;
    if (latestFile) {
      latestInsight = await AiInsight.findOne({ file: latestFile._id }).lean();
    }

    res.status(200).send({
      dashboard: {
        totalReports,
        totalVitals,
        latestVital:   latestVital  || null,
        latestReport:  latestFile   || null,
        latestInsight: latestInsight|| null,
      },
    });
  } catch (err) {
    res.status(500).send({ message: "Dashboard fetch failed", error: err.message });
  }
};