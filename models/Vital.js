import mongoose from "mongoose";

const vitalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "healthusers",
      required: true,
    },
    bp: {
      type: String,
      required: true,
    },
    sugar: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
    // AI suggestion saved after analyzeVitals is called
    aiSuggestion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export const Vital = mongoose.model("healthvitals", vitalSchema);