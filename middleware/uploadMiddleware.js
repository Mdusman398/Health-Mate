import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF or images allowed"));
    }

    cb(null, true);
  }
});

export default upload;