import { AzureChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();
export const model = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_VERSION,
  temperature: 0.3,
});