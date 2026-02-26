const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("mongodb connected successfully");
  } catch (err) {
    res
      .status(500)
      .send({ message: "internal err while connecting mongodb", err });
    process.exit(1);
  }
};

module.exports = connectDB;
