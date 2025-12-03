// ✅ backend/CONFIG/multer.config.js

import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");  // Temporary local storage
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  // For products: only image formats
  const allowedExtensions = [".jpg", ".jpeg", ".webp", ".png"];
  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(
        `Unsupported file type: ${ext}. Allowed types: ${allowedExtensions.join(
          ", "
        )}`
      ),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max for images
  fileFilter,
});

export default upload;
