import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";
import fileRouter from "./routes/file.routes.js";
import queryRouter from "./routes/query.routes.js";
configDotenv();
const app = express();

app.use(express.json());
app.use(cors());  
app.use("/file",fileRouter)
app.use("/ask",queryRouter)

app.listen(process.env.PORT, () => {
  console.log("Server is listening at ", process.env.PORT);
});







