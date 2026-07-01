import { sendSuccess } from "../utils/apiResponse.util";
import { AppError, ValidationError, AuthenticationError, AuthorizationError, DatabaseError } from "../utils/errors";
import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

export const debugGemini = async (_req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiKey2 = process.env.GEMINI_API_KEY_2;
  const apiKey3 = process.env.GEMINI_API_KEY_3;

  const result: {
    envLoaded: boolean;
    apiKeyPresent: boolean;
    apiKey2Present: boolean;
    apiKey3Present: boolean;
    modelName: string;
    geminiConnectionTest: boolean;
    exactError: string | null;
  } = {
    envLoaded: !!process.env.NODE_ENV,
    apiKeyPresent: !!apiKey,
    apiKey2Present: !!apiKey2,
    apiKey3Present: !!apiKey3,
    modelName: "gemini-flash-latest",
    geminiConnectionTest: false,
    exactError: null,
  };

  if (!apiKey) {
    result.exactError = "GEMINI_API_KEY environment variable is not set.";
    return sendSuccess(res, result);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Say exactly: OK",
    });
    const text = (response as any).text;
    if (text) {
      result.geminiConnectionTest = true;
    } else {
      result.exactError = "Gemini responded but returned empty text.";
    }
  } catch (err: any) {
    try {
      const parsed = JSON.parse(err.message);
      result.exactError = JSON.stringify(parsed?.error || parsed);
    } catch {
      result.exactError = err.message || String(err);
    }
  }

  return sendSuccess(res, result);
};
