export enum TelemetryStatus {
  SUCCESS = "SUCCESS",
  UNKNOWN = "UNKNOWN",
  TIMEOUT = "TIMEOUT",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  MODEL_ERROR = "MODEL_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR"
}

export enum TelemetryErrorCode {
  TIMEOUT = "TIMEOUT",
  JSON_PARSE = "JSON_PARSE",
  INVALID_SCHEMA = "INVALID_SCHEMA",
  NETWORK = "NETWORK",
  MODEL = "MODEL",
  UNKNOWN = "UNKNOWN",
  NONE = "NONE"
}

export interface AITelemetryEvent {
  userId?: string | null;
  aiVersion: string;
  model: string;
  latencyMs: number;
  status: TelemetryStatus;
  retryCount: number;
  validationFailed: boolean;
  normalizationCorrected: boolean;
  material: string;
  confidence: number;
  errorCode: TelemetryErrorCode;
}
