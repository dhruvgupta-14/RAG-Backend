import { AzureOpenAIEmbeddings} from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();

export const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
  azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
  azureOpenAIApiVersion:  process.env.AZURE_OPENAI_API_VERSION,
  maxRetries: 1,
});