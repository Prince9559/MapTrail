
const express = require("express");
const router = express.Router();

const {
  savePlace,
  getSavedPlaces,
  deleteSavedPlace,
} = require("../controllers/savedPlace.controller");

const authMiddleware = require("../middleware/auth.middleware");

// All saved-place APIs require login.
router.use(authMiddleware);

router.post("/", savePlace);
router.get("/", getSavedPlaces);
router.delete("/:savedPlaceId", deleteSavedPlace);

module.exports = router;
