import { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 4 doesn't catch rejected promises from async route handlers --
// an unhandled rejection propagates past Express entirely and, on modern
// Node, terminates the whole process instead of just failing that request.
// Wrapping every async handler with this routes the error to next() so
// Express's error middleware handles it and the server stays up.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
