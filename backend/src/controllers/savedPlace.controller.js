
const mongoose = require("mongoose");
const SavedPlace = require("../models/SavedPlace");

// Save a place
const savePlace = async (req, res) => {
  try {
    const {
      placeId,
      name,
      address = "",
      latitude,
      longitude,
      category = "other",
    } = req.body || {};

    if (
      typeof placeId !== "string" ||
      !placeId.trim() ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid placeId, name, latitude and longitude are required.",
      });
    }

    if (
      typeof address !== "string" ||
      typeof category !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Address and category must be strings.",
      });
    }

    // Authentication middleware must set req.user._id or req.user.id.
    const userId = req.user?._id || req.user?.id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to save places.",
      });
    }

    const existingPlace = await SavedPlace.findOne({
      user: userId,
      placeId: placeId.trim(),
    });

    if (existingPlace) {
      return res.status(409).json({
        success: false,
        message: "This place is already saved.",
        place: existingPlace,
      });
    }

    const savedPlace = await SavedPlace.create({
      user: userId,
      placeId: placeId.trim(),
      name: name.trim(),
      address: address.trim(),
      latitude,
      longitude,
      category: category.trim() || "other",
    });

    return res.status(201).json({
      success: true,
      message: "Place saved successfully.",
      place: savedPlace,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This place is already saved.",
      });
    }

    console.error("Save place error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save place.",
    });
  }
};

// Get all places saved by the logged-in user
const getSavedPlaces = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view saved places.",
      });
    }

    const places = await SavedPlace.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: places.length,
      places,
    });
  } catch (error) {
    console.error("Get saved places error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved places.",
    });
  }
};

// Delete a saved place using its MongoDB document ID
const deleteSavedPlace = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { savedPlaceId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to delete saved places.",
      });
    }

    if (!mongoose.isValidObjectId(savedPlaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid saved place ID.",
      });
    }

    const place = await SavedPlace.findOneAndDelete({
      _id: savedPlaceId,
      user: userId,
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Saved place not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Saved place deleted successfully.",
    });
  } catch (error) {
    console.error("Delete saved place error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete saved place.",
    });
  }
};

module.exports = {
  savePlace,
  getSavedPlaces,
  deleteSavedPlace,
};
