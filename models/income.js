const mongoose = require("mongoose")
const incomeSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "expenseuser",
        required : true
    },
    icon: {
        type: String,

    },
    source: {
        type: String,
        required : true
    },
    amount : {
        type: Number,
        required : true
    },
    date: {
        type : Date,
        default : Date.now
    }
}, {
    timestamps : true
})
const Income = mongoose.model("incomes", incomeSchema)
module.exports = Income