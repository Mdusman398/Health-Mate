import { Vital } from "../models/Vital.js";

// ─── Add Vital ────────────────────────────────────────────────────────────────
export const addVital = async (req, res) => {
  try {
    const { bp, sugar, weight, notes, date } = req.body;

    if (!bp || !sugar || !weight || !date) {
      return res.status(400).send({ message: "bp, sugar, weight and date are required" });
    }

    const vital = await Vital.create({
      user: req.user._id,
      bp,
      sugar,
      weight,
      notes: notes || "",
      date,
    });

    res.status(201).send({ message: "Vital added successfully", vital });
  } catch (err) {
    res.status(500).send({ message: "Error adding vital", error: err.message });
  }
};

// ─── Get All Vitals for Logged-in User ───────────────────────────────────────
export const getVitals = async (req, res) => {
  try {
    const vitals = await Vital.find({ user: req.user._id }).sort({ date: -1 });
    res.status(200).send({ message: "Vitals fetched successfully", vitals });
  } catch (err) {
    res.status(500).send({ message: "Error fetching vitals", error: err.message });
  }
};

// ─── Delete a Vital ───────────────────────────────────────────────────────────
export const deleteVital = async (req, res) => {
  try {
    const vital = await Vital.findById(req.params.id);
    if (!vital) return res.status(404).send({ message: "Vital not found" });

    if (vital.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    await vital.deleteOne();
    res.status(200).send({ message: "Vital deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: "Error deleting vital", error: err.message });
  }
};