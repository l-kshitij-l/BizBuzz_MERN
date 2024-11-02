import express from "express";
import { loginUser, registerUser } from "../Controllers/AuthController.js";

const router = express.Router();
//whenever we want to send some data to server, we use post request
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
