
const mongoose = require("mongoose");
const SavedRoute = require("../models/SavedRoute");

const isValidCoordinate = (value, min, max) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

// POST: Save a route
const saveRoute = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      origin,
      destination,
      distanceMeters = null,
      durationSeconds = null,
      encodedPolyline = null,
      travelMode = "DRIVE",
      title = "",
      notes = "",
    } = req.body || {};

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to save routes.",
      });
    }

    const validLocation = (location) =>
      location &&
      typeof location.name === "string" &&
      location.name.trim() &&
      isValidCoordinate(location.latitude, -90, 90) &&
      isValidCoordinate(location.longitude, -180, 180);

    if (!validLocation(origin) || !validLocation(destination)) {
      return res.status(400).json({
        success: false,
        message:
          "Origin and destination must include a name and valid coordinates.",
      });
    }

    if (
      (distanceMeters !== null &&
        (!Number.isFinite(distanceMeters) || distanceMeters < 0)) ||
      (durationSeconds !== null &&
        (!Number.isFinite(durationSeconds) || durationSeconds < 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Distance and duration must be non-negative numbers.",
      });
    }

    if (
      (encodedPolyline !== null &&
        typeof encodedPolyline !== "string") ||
      typeof title !== "string" ||
      typeof notes !== "string" ||
      !["DRIVE", "WALK", "BICYCLE", "TRANSIT"].includes(travelMode)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid route details or travel mode.",
      });
    }

    const savedRoute = await SavedRoute.create({
      user: userId,
      origin: {
        name: origin.name.trim(),
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      destination: {
        name: destination.name.trim(),
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
      distanceMeters,
      durationSeconds,
      encodedPolyline,
      travelMode,
      title: title.trim(),
      notes: notes.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Route saved successfully.",
      route: savedRoute,
    });
  } catch (error) {
    console.error("Save route error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save route.",
    });
  }
};

// GET: Get routes saved by the logged-in user
const getSavedRoutes = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view saved routes.",
      });
    }

    const routes = await SavedRoute.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: routes.length,
      routes,
    });
  } catch (error) {
    console.error("Get saved routes error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved routes.",
    });
  }
};

// DELETE: Delete one of the logged-in user's saved routes
const deleteSavedRoute = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { savedRouteId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to delete saved routes.",
      });
    }

    if (!mongoose.isValidObjectId(savedRouteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid saved route ID.",
      });
    }

    const route = await SavedRoute.findOneAndDelete({
      _id: savedRouteId,
      user: userId,
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Saved route not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Saved route deleted successfully.",
    });
  } catch (error) {
    console.error("Delete saved route error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete saved route.",
    });
  }
};

module.exports = {
  saveRoute,
  getSavedRoutes,
  deleteSavedRoute,
};
