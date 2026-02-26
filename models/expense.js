const mongoose = require("mongoose")
const expenseSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "expenseuser",
        required : true
    },
    icon: {
        type: String,

    },
    category: {
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
const Expense = mongoose.model("expenses", expenseSchema)
module.exports = Expense