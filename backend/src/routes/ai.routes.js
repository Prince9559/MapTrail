
const express = require("express");
const router = express.Router();

const { askTravelAI } = require("../controllers/ai.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.post("/ask", askTravelAI);

module.exports = router;
