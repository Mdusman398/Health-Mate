import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .send({ message: "session expired not token found" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).send({ message: "user not found" });
    }
    req.user = user
    next();
  } catch (err) {
    res.status(401).send({ message: "internal err", err: err.message });
  }
};

export default auth;
