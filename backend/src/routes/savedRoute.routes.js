
const express = require("express");
const router = express.Router();

const {
  saveRoute,
  getSavedRoutes,
  deleteSavedRoute,
} = require("../controllers/savedRoute.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.post("/", saveRoute);
router.get("/", getSavedRoutes);
router.delete("/:savedRouteId", deleteSavedRoute);

module.exports = router;
