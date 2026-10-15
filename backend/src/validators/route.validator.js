
const isValidCoordinate = (value, min, max) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

const validateDirections = (req, res, next) => {
  const {
    originLat,
    originLng,
    destinationLat,
    destinationLng,
  } = req.body || {};

  if (
    !isValidCoordinate(originLat, -90, 90) ||
    !isValidCoordinate(originLng, -180, 180) ||
    !isValidCoordinate(destinationLat, -90, 90) ||
    !isValidCoordinate(destinationLng, -180, 180)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Valid numeric originLat, originLng, destinationLat and destinationLng are required.",
    });
  }

  next();
};

const validateRoadTripSearch = (req, res, next) => {
  const {
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    query,
    maxDetourMinutes,
    travelMode,
  } = req.body || {};

  if (
    !isValidCoordinate(originLat, -90, 90) ||
    !isValidCoordinate(originLng, -180, 180) ||
    !isValidCoordinate(destinationLat, -90, 90) ||
    !isValidCoordinate(destinationLng, -180, 180)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid origin and destination coordinates are required.",
    });
  }

  if (typeof query !== "string" || !query.trim() || query.trim().length > 200) {
    return res.status(400).json({
      success: false,
      message: "Query must contain 1 to 200 characters.",
    });
  }

  if (
    maxDetourMinutes !== undefined &&
    (!Number.isFinite(maxDetourMinutes) ||
      maxDetourMinutes < 0 ||
      maxDetourMinutes > 180)
  ) {
    return res.status(400).json({
      success: false,
      message: "maxDetourMinutes must be between 0 and 180.",
    });
  }

  const allowedTravelModes = ["DRIVE", "WALK", "BICYCLE", "TRANSIT"];

  if (
    travelMode !== undefined &&
    !allowedTravelModes.includes(travelMode)
  ) {
    return res.status(400).json({
      success: false,
      message: `travelMode must be one of: ${allowedTravelModes.join(", ")}.`,
    });
  }

  next();
};

module.exports = {
  validateDirections,
  validateRoadTripSearch,
};
