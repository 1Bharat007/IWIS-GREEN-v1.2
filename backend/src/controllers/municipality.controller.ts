import { AppError, ValidationError, AuthenticationError, AuthorizationError, DatabaseError } from "../utils/errors";
import { sendSuccess } from "../utils/apiResponse.util";
import { Request, Response } from "express";
import {
  getWardAnalytics,
  getCollectionTrends,
  getMaterialHeatmaps,
  getCitizenParticipation,
  getPredictionAccuracy,
  getMonthlyReport,
  getFutureForecast
} from "../services/municipality.service";

export const getDashboard = async (req: any, res: Response) => {
  try {
    const wardId = req.query.wardId as string;
    
    // Execute all lightweight analytics concurrently
    const [
      wardAnalytics,
      trends,
      heatmaps,
      participation,
      accuracy,
      forecast
    ] = await Promise.all([
      getWardAnalytics(wardId || "ALL"),
      getCollectionTrends(wardId),
      getMaterialHeatmaps(),
      getCitizenParticipation(),
      getPredictionAccuracy(),
      getFutureForecast()
    ]);

    sendSuccess(res, {
      wardAnalytics,
      trends,
      heatmaps,
      participation,
      predictionAccuracy: accuracy,
      forecast
    });
  } catch (err) {
    console.error("[Municipality] Error generating dashboard:", err);
    throw new DatabaseError("Failed to generate municipality dashboard");
  }
};

export const getReport = async (req: any, res: Response) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      throw new ValidationError("month and year are required parameters");
    }
    
    const report = await getMonthlyReport(month as string, year as string);
    sendSuccess(res, report);
  } catch (err) {
    console.error("[Municipality] Error generating report:", err);
    throw new DatabaseError("Failed to generate report");
  }
};
