import { Request, Response, NextFunction } from "express";
import {
  getCitizenAnalytics,
  getRecyclerAnalytics,
  getMunicipalityAnalytics,
  getDashboardMetrics,
  getAITelemetry
} from "../services/analytics.service";
import { sendSuccess } from "../utils/apiResponse.util";

export const getAITelemetryDashboard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getAITelemetry();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getCitizenDashboard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getCitizenAnalytics(req.user.id);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getRecyclerDashboard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getRecyclerAnalytics(req.user.id);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getPlatformDashboard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getDashboardMetrics();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};
