
const express = require("express");
const router = express.Router();

const {
  addSearchHistory,
  getSearchHistory,
  clearSearchHistory,
} = require("../controllers/history.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.post("/", addSearchHistory);
router.get("/", getSearchHistory);
router.delete("/", clearSearchHistory);

module.exports = router;
