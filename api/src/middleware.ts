import { RequestHandler, ErrorRequestHandler } from "express";

export const notFound: RequestHandler = (req, res, next) => {
  res.status(404).json({ message: "Not Found" });
};

export const serverError: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server Error" });
};
