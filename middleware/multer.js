import multer from "multer"
import path from "path"
import fs from "fs"

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "text/plain", // .txt
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only PDF, DOCX, and TXT allowed."));
  }
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp') // store file in ./temp folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext=path.extname(file.originalname) // keep original file extension
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

