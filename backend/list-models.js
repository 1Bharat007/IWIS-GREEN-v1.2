"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: ".env" });
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function listModels() {
    try {
        const models = await ai.models.list();
        for await (const model of models) {
            console.log(`Model: ${model.name} | Display Name: ${model.displayName}`);
        }
    }
    catch (error) {
        console.error("Failed to list models:", error);
    }
}
listModels();
