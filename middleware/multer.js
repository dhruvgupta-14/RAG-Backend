import multer from "multer"
import path from "path"
import fs from "fs"
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"));
  }
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext=path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix+ext)
  }
})
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 40 * 1024 * 1024 
  }
});
export const deleteLocalFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`Local file deleted: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting local file: ${error}`);
  }
};

