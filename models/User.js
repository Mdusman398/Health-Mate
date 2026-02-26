const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    fullName : {
        type: String,
        required : true,
    },
    email : {
        type: String,
        required : true,
        unique: true
    },
    password : {
        type: String,
        required : true,
    },
    profileImageUrl : {
        type: String,
        default: null
    },
}, {
    timestamps : true
});

const User = mongoose.model("expenseuser", userSchema);
module.exports = User