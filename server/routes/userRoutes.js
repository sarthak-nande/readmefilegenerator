import express from "express";
import { generatedReadme } from "../controller/userController.js";

const route = express.Router();

route.post("/generate" , generatedReadme);

export default route;