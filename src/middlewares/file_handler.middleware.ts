import { NextFunction, Request, Response } from "express";

export default async function file_handler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(req.files);

  res.status(200).send();
}
