import cloudinary from "../config/cloudinary.js";
import { File } from "../models/file.js";

export const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64Data, {
      folder: "healthmate/reports",
      resource_type: "auto",
    });

    const file = await File.create({
      user:       req.user._id,
      fileUrl:    result.secure_url,
      publicId:   result.public_id,
      reportType: req.body.reportType,
      reportDate: req.body.reportDate,
    });

    res.status(201).send({
      message:  "Report uploaded successfully",
      fileId:   file._id,         
      url:      result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).send({ message: err.message });
  }
};