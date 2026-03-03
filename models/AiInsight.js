import mongoose from "mongoose";
const aiInsightSchema = new mongoose.Schema({
    file : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "healthfiles",
    required : true
    },
    englishSummary : {
        type: String,

    },
    urduSummary : {
        type : String
    },
    abnoramalValues: [{
        type: String

    }],
    doctorQuestions : [{
        type: String
    }],
    foodSuggestions : [{
        type: String
    }],
    homeRemedies : [{
      type: String
    }],
    disclaimer : {
        type: String,
        default : "Ai is for understanding only.. not for medical advice"
    }

}, {
    timestamps :true
}

)

export const AiInsight = mongoose.model("healthaisuggestions", aiInsightSchema)