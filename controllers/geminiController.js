import geminiModel from "../config/gemini.js";
import { AiInsight } from "../models/AiInsight.js";
import { File } from "../models/file.js";
import { Vital } from "../models/Vital.js";
import axios from "axios";

const isHealthRelated = (text) => {
  const kws = [
    "blood",
    "sugar",
    "pressure",
    "weight",
    "report",
    "test",
    "result",
    "doctor",
    "medicine",
    "symptom",
    "disease",
    "health",
    "pain",
    "fever",
    "glucose",
    "cholesterol",
    "hemoglobin",
    "urine",
    "bp",
    "bmi",
    "diet",
    "food",
    "remedy",
    "vitamin",
    "infection",
    "lab",
    "analysis",
    "vital",
    "heart",
    "kidney",
    "liver",
    "thyroid",
    "diabetes",
    "hypertension",
    "anemia",
    "oxygen",
    "pulse",
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

    const prompt = `You are HealthMate AI, a medical report assistant for Pakistani users.

STRICT LANGUAGE RULE — THIS IS MANDATORY:
You MUST write every single field in Roman Urdu mixed with English medical terms.
Roman Urdu means: Urdu language written using English/Latin letters.
CORRECT: "Aapka hemoglobin low hai — yeh iron ki kami ki nishani hai. Doctor se zaroor milein."
WRONG: "Your hemoglobin is low due to iron deficiency."
Mix English medical terms (hemoglobin, WBC, glucose) with Roman Urdu explanation words.

Analyze the provided health report and respond ONLY in this exact JSON. No text outside JSON.

{
  "englishSummary": "Roman Urdu + English mix. Example: 'Is report mein kuch important cheezein hain. Aapka hemoglobin low hai jo iron deficiency anemia ki taraf ishara karta hai. WBC bhi high hai jo kisi infection ki wajah se ho sakta hai. Doctor se zaroor milein.'",
  "urduSummary": "Sirf Roman Urdu mein. Example: 'Aapki report mein khoon ki kami hai. Blood sugar bhi thodi zyada hai. Cholesterol ka HDL part kam hai jo dil ke liye theek nahi. Doctor se milna zaroori hai.'",
  "abnormalValues": ["Roman Urdu mix. Example: 'Hemoglobin: 10.5 g/dL — Yeh low hai (Normal: 13.5-17.5). Iron ki kami ho sakti hai.'"],
  "doctorQuestions": ["Roman Urdu mix. Example: 'Meri anemia ki wajah kya hai aur kya mujhe iron ki dawai leni chahiye?'"],
  "foodSuggestions": ["Roman Urdu mix. Example: 'Palak, daal aur gosht khayein — yeh iron se bharpur hain aur hemoglobin badhate hain.'"],
  "homeRemedies": ["Roman Urdu mix. Example: 'Roz 30 minute walk karein — blood sugar control rehti hai aur dil bhi strong hota hai.'"],
  "disclaimer": "Yeh AI analysis sirf samajhne ke liye hai — apne doctor se zaroor milein. Yeh professional medical advice nahi hai."
}

If not a medical report: {"error": "Yeh medical report nahi lagti. Please valid health report upload karein."}`;
    const result = await geminiModel.generateContent([
      { inlineData: { mimeType, data: base64 } },
      { text: prompt },
    ]);

    const cleaned = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.error) return res.status(400).send({ message: parsed.error });

    const insight = await AiInsight.findOneAndUpdate(
      { file: req.params.fileId },
      {
        file: req.params.fileId,
        englishSummary: parsed.englishSummary,
        urduSummary: parsed.urduSummary,
        abnoramalValues: parsed.abnormalValues,
        doctorQuestions: parsed.doctorQuestions,
        foodSuggestions: parsed.foodSuggestions,
        homeRemedies: parsed.homeRemedies,
        disclaimer: parsed.disclaimer,
      },
      { upsert: true, new: true },
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
    const insight = await AiInsight.findOne({
      file: req.params.fileId,
    }).populate("file");
    // Return null insight gracefully — frontend will show "Analyze" button
    res.status(200).send({ insight: insight || null });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error fetching insight", error: err.message });
  }
};

// ─── 3. Report History — ALL user files + their insight if available ──────────
//  THIS is the key fix: fetch Files first, attach insight where it exists
export const getReportHistory = async (req, res) => {
  try {
    // Get all files uploaded by this user
    const files = await File.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    // For each file, find its insight (may be null)
    const insights = await Promise.all(
      files.map(async (file) => {
        const insight = await AiInsight.findOne({ file: file._id }).lean();
        return {
          _id: insight?._id || file._id,
          file: file,
          englishSummary: insight?.englishSummary || null,
          urduSummary: insight?.urduSummary || null,
          abnoramalValues: insight?.abnoramalValues || [],
          doctorQuestions: insight?.doctorQuestions || [],
          foodSuggestions: insight?.foodSuggestions || [],
          homeRemedies: insight?.homeRemedies || [],
          disclaimer: insight?.disclaimer || null,
          analyzed: !!insight,
        };
      }),
    );

    res.status(200).send({ insights });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error fetching report history", error: err.message });
  }
};

// ─── 4. Vital Analysis ────────────────────────────────────────────────────────
export const analyzeVitals = async (req, res) => {
  try {
    const vital = await Vital.findById(req.params.vitalId);
    if (!vital) return res.status(404).send({ message: "Vital not found" });
    if (vital.user.toString() !== req.user._id.toString())
      return res.status(403).send({ message: "Unauthorized" });

    const prompt = `You are HealthMate AI for Pakistani users.

STRICT LANGUAGE RULE — MANDATORY:
Write EVERYTHING in Roman Urdu mixed with English medical terms.
Roman Urdu = Urdu language using English/Latin letters.
CORRECT: "Aapka blood pressure ${vital.bp} hai jo normal range mein hai — yeh bohat acha hai."
WRONG: "Your blood pressure is in the normal range."

User ke vitals:
- Blood Pressure: ${vital.bp}
- Blood Sugar: ${vital.sugar} mg/dL  
- Weight: ${vital.weight} kg
- Date: ${vital.date}
- Notes: ${vital.notes || "None"}

Respond ONLY in this exact JSON. No text outside JSON.

{
  "summary": "Roman Urdu + English mix, 3-4 sentences. Example: 'Aapka blood pressure normal hai — yeh acha hai. Blood sugar ${vital.sugar} mg/dL hai jo thodi high hai, normal 70-100 hoti hai. Meethi cheezein aur maida kam karein aur doctor se milte rahein.'",
  "foodSuggestions": [
    "Roman Urdu mix. Example: 'Palak aur sabziyan zyada khayein — blood sugar control rehti hai.'",
    "Roman Urdu mix. Example: 'Meethi drinks aur white rice kam karein — sugar level theek rehta hai.'"
  ],
  "homeRemedies": [
    "Roman Urdu mix. Example: 'Subah khali pet 20-30 minute walk karein — BP aur sugar dono theek rehte hain.'",
    "Roman Urdu mix. Example: 'Namak kam karein — blood pressure normal rehta hai.'"
  ],
  "disclaimer": "Yeh AI analysis sirf samajhne ke liye hai. Apne doctor se zaroor milein."
}`;

    const result = await geminiModel.generateContent(prompt);
    const cleaned = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    res
      .status(200)
      .send({ message: "Vital analysis complete", analysis: parsed });
  } catch (err) {
    console.error("analyzeVitals error:", err);
    res
      .status(500)
      .send({ message: "Vital analysis failed", error: err.message });
  }
};

// ─── 5. Health Chat ───────────────────────────────────────────────────────────
export const healthChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim())
      return res.status(400).send({ message: "Message required" });

    if (!isHealthRelated(message)) {
      return res.status(200).send({
        reply:
          "I can only help with health-related questions. Please ask about your reports, symptoms, vitals, or general health topics.\n\n(Main sirf sehat se mutalliq sawaalon ka jawab de sakta hoon. Apni report, symptoms ya vitals ke baare mein poochhein.)",
      });
    }

    const prompt = `You are HealthMate AI — a friendly health assistant for Pakistani users.

STRICT LANGUAGE RULE — MANDATORY:
You MUST respond in Roman Urdu mixed with English medical terms.
Roman Urdu = Urdu language written in English/Latin letters.
CORRECT: "High blood pressure ka matlab hai ke aapki arteries mein zyada pressure hai. Namak aur greasy cheezein kam karein. Roz 30 minute walk karein."
WRONG: "High blood pressure means there is excess pressure in your arteries."
Every response MUST have Roman Urdu — do not write pure English.

User ka sawal: "${message}"

3-5 sentences mein helpful jawab do in Roman Urdu + English mix.
End with: "Disclaimer: Yeh sirf general information hai — apne doctor se zaroor milein."`;

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

    const [totalReports, totalVitals, latestVital, latestFile] =
      await Promise.all([
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
        latestVital: latestVital || null,
        latestReport: latestFile || null,
        latestInsight: latestInsight || null,
      },
    });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Dashboard fetch failed", error: err.message });
  }
};
