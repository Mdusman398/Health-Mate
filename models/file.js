import mongoose from "mongoose";
const fileSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "healthusers",
        required : "true"
    },
    fileUrl : {
        type: String,
        required: true
    },
    publicId : {
        type : String,
        required : true
    },
    reportType:{
        type : String,

    },
    reportDate :{
        type: Date,
        required :true
    }
    
}, 
{
    timestamps: true
}

)

export const File = mongoose.model("healthfiles", fileSchema)
