
const isValidCoordinate = (value, min, max) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

const validateNearbyPlaces = (req, res, next) => {
  const { latitude, longitude, radius, category } = req.body || {};

  if (
    !isValidCoordinate(latitude, -90, 90) ||
    !isValidCoordinate(longitude, -180, 180)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid numeric latitude and longitude are required.",
    });
  }

  if (
    radius !== undefined &&
    (!Number.isFinite(radius) || radius < 1 || radius > 50000)
  ) {
    return res.status(400).json({
      success: false,
      message: "Radius must be between 1 and 50000 meters.",
    });
  }

  const allowedCategories = [
    "hotels",
    "hospitals",
    "petrol_pumps",
    "restaurants",
  ];

  if (
    category !== undefined &&
    (typeof category !== "string" ||
      !allowedCategories.includes(category))
  ) {
    return res.status(400).json({
      success: false,
      message: `Category must be one of: ${allowedCategories.join(", ")}.`,
    });
  }

  next();
};

const validatePlaceId = (req, res, next) => {
  const { placeId } = req.params;

  if (
    typeof placeId !== "string" ||
    !placeId.trim() ||
    placeId.length > 300
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid place ID is required.",
    });
  }

  next();
};

const validatePlaceSearch = (req, res, next) => {
  const { query } = req.body || {};

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      success: false,
      message: "A search query is required.",
    });
  }

  if (query.trim().length > 200) {
    return res.status(400).json({
      success: false,
      message: "Search query must not exceed 200 characters.",
    });
  }

  next();
};

module.exports = {
  validateNearbyPlaces,
  validatePlaceId,
  validatePlaceSearch,
};
