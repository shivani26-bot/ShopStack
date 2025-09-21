//all below are custom error class
// AppError is a base error class,extends the built-in Error class and adds extra properties
// isOperational: Marks whether the error is an expected, known (operational) error (e.g., user input errors) or a programming/unknown error (e.g., null pointer).
// details (optional): Additional metadata or error information (e.g., Joi/Zod validation details).
// readonly: Once set in the constructor, it cannot be modified.
// built-in Error class only gives you: message, name (default "Error"), stack
//  Error.captureStackTrace(this):Your custom error object (this) will now have a .stack property just like a native error, but cleaner.
// Attach a stack trace to this object, starting from the point where it was created — and skip this constructor line or frame.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true, //defaults to true,can be overridden
    details?: any
  ) {
    super(message); //Calls the parent Error constructor with the message.Sets the inherited message property of the Error object.
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this); //Node.js-specific method ,Captures the stack trace of where the error was created.helps with debugging by showing the call site of the error (excluding the constructor itself).
  }
}

// not found error
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

// validation error (used for joi/zod/react-hook-form validation errors)
export class ValidationError extends AppError {
  constructor(message = "Invalid request data", details?: any) {
    super(message, 400, true, details);
  }
}

//authentication error
export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

//forbidden error (for insufficient permissions)
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden Access") {
    super(message, 403);
  }
}

//database error (for mongodb/postgres errors)
export class DatabaseError extends AppError {
  constructor(message = "Database error", details?: any) {
    super(message, 500, true, details);
  }
}

//rate limit error (if user exceeds api limits)
export class RateLimitError extends AppError {
  constructor(message = "To many requests, please try again later") {
    super(message, 429);
  }
}
