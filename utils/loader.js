import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text"
 

export const getLoader = (filePath, mimetype) => {
  switch (mimetype) {
    case "application/pdf":
      return new PDFLoader(filePath);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return new DocxLoader(filePath);
    case "text/plain":
      return new TextLoader(filePath);
    default:
      throw new Error("Unsupported file type");
  }
};