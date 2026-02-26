const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs")

const registerUser = async (req,res) => {
    const {fullName, email , password, profileImageUrl} = req.body;

    if(!fullName|| !email || !password){
        return res.status(400).send({message : "please fill all the fields"})
    }
    try{
        const existingUser = await User.findOne({email})
        if(existingUser){
            return res.status(403).send({message: "user already exist "})
        }

        const salt = await bcrypt.genSalt(10)
        const hashed = await bcrypt.hash(password, salt)
        const user = await User.create({
            fullName,
            email,
            password : hashed,
            profileImageUrl
        })

        res.status(201).send({
            message :"user created successfully",
            id: user._id,
            user
         })
    }catch(err){
        res.status(500).send({message: "internal error" , err: err.message})
    }
    
}
const loginUser = async (req,res) => {
    const {email, password} = req.body;
    if(!email || !password){
         return res.status(400).send({message : "please filll all the fields"})

    }
    try{
        const user = await User.findOne({email})
        if(!user){
            return res.status(403).send({message : "user not exist"})
        }
        const comparePass = await bcrypt.compare(password, user.password)
        if(!comparePass){
            return res.status(404).send({message : "invalid user credentials"})
        }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" }); 
        res.cookie("token", token, {
        httpOnly: true, 
        secure: false, //
        maxAge: 3600000, 
        sameSite: 'lax'
    });

        res.status(200).send({message : "login successfully" , user, token})

    }catch(err){
        res.status(500).send({message : "internal error during login" , err : err.message })
    }

}
const getUserInfo = async (req,res) => {

    try{

        const user = await User.findById(req.params.id)
        if(!user){
            return res.status(403).send({message: "user not found"})
        }
        res.status(200).send({message : "user fetch successfully" , user})

    }catch(err){
        res.status(500).send({message: "internal error during fetching user",
         err: err.message

        })
    }

}

const updateProfile = async (req, res) => {
    try {
        const userId = req.user && req.user._id
        if(!userId) return res.status(401).send({ message: 'Unauthorized' })

        const { fullName } = req.body
        const update = {}
        if(fullName) update.fullName = fullName
        if(req.file) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            update.profileImageUrl = imageUrl
        }

        const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password')
        res.status(200).send({ message: 'profile updated', user: updatedUser })
    } catch(err){
        res.status(500).send({ message: 'internal error updating profile', err: err.message })
    }
}

const logout = async (req, res) => {
    try{

        res.cookie("token", "")
        res.send({message : "logout successfully"})
    }catch(err){
        res.send({message : "internal err during logout", err: err.message})
    }
}
module.exports = {registerUser,loginUser,getUserInfo, logout, updateProfile}