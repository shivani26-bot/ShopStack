// centralized error-handling function
// Checks if the error is an instance of your custom AppError.
// Sends a structured error response to the client if it's expected.
// Falls back to a generic 500 response if it's an unexpected/internal error.

import { NextFunction, Request, Response } from "express";
import { AppError } from ".";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    console.log(`Error ${req.method} ${req.url} - ${err.message}`);
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }), //If err.details exists, then add a details field to the response JSON with its value. spread the err.details field,If err.details = undefined, it becomes:...false nothing is spread, details field is omitted from final response
    });
  }
  console.log("unhandled error:", err);

  return res.status(500).json({
    error: "Something went wrong, please try again",
  });
};

// with details
// {
//   "status": "error",
//   "message": "Invalid input",
//   "details": {
//     "field": "email",
//     "issue": "invalid format"
//   }
// }

// without details:
// {
//   "status": "error",
//   "message": "Invalid input"
// }
