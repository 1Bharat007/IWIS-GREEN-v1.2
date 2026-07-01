export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Permission denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");
  }
}

export class AIServiceError extends AppError {
  constructor(message: string = "AI service failed") {
    super(message, 502, "AI_SERVICE_ERROR");
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = "External service failed") {
    super(message, 502, "EXTERNAL_SERVICE_ERROR");
  }
}

// Keep ApiError for backward compatibility until fully migrated
export class ApiError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, "API_ERROR");
  }
}
