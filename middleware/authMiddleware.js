const jwt = require("jsonwebtoken")
const User = require("../models/User")
const auth = async (req, res,next) => {
    try{
         const token = req.cookies.token;
         if(!token){
            return res.status(401).send({message : "session expired not token found"})
         }
         const decoded = jwt.verify(token, process.env.JWT_SECRET)
         req.user = await User.findById(decoded.id).select("-password")
         next()

    }catch(err){
        res.status(401).send({message : "internal err" , err : err.message})
    }
} 
module.exports = auth