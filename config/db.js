import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("mongodb connected successfully");
  } catch (err) {
    console.error("internal err while connecting mongodb", err);
    process.exit(1);
  }
};

export default connectDB;