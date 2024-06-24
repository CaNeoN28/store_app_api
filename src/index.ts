import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.listen(3000, () => {});
