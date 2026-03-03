import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).send({ message: "please fill all the fields" });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(403).send({ message: "user already exist " });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({
      fullName,
      email,
      password: hashed,
    });

    res.status(201).send({
      message: "user created successfully",
      id: user._id,
      user,
    });
  } catch (err) {
    res.status(500).send({ message: "internal error", err: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({ message: "please filll all the fields" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(403).send({ message: "user not exist" });
    }
    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return res.status(404).send({ message: "invalid user credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 3600000,
    });

    res.status(200).send({ message: "login successfully", user, token });
  } catch (err) {
    res
      .status(500)
      .send({ message: "internal error during login", err: err.message });
    }
  };
  
  export const logout = async (req, res) => {
    try {
      res.cookie("token", "");
      res.send({ message: "logout successfully" });
    } catch (err) {
      res.send({ message: "internal err during logout", err: err.message });
    }
  };
