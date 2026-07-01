import { Response } from "express";

export const sendSuccess = (res: Response, data: any, message: string = "Success", meta?: any) => {
  res.json({
    success: true,
    data,
    meta,
    message
  });
};

export const sendError = (res: Response, statusCode: number, message: string, code: string = "ERROR", errorDetail?: any) => {
  res.status(statusCode).json({
    success: false,
    error: errorDetail || message,
    code,
    message
  });
};
