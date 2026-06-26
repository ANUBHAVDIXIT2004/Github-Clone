const mongoose = require("mongoose");

const commitSchema = new mongoose.Schema(
{
    repo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Repository",
        required:true
    },

    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    message:{
        type:String,
        required:true
    },

    action:{
        type:String,
        enum:["ADD","DELETE","EDIT"],
        required:true
    },

    fileName:{
        type:String,
        required:true
    }

},
{
    timestamps:true
});

module.exports = mongoose.model("Commit", commitSchema);