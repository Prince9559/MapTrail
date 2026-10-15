
const mongoose = require("mongoose");
const SearchHistory = require("../models/SearchHistory");

// POST: Save a search in history
const addSearchHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      query,
      category = "all",
      latitude = null,
      longitude = null,
      resultCount = 0,
    } = req.body || {};

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to save search history.",
      });
    }

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "A search query is required.",
      });
    }

    if (typeof category !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category must be a string.",
      });
    }

    const validCoordinate = (value, min, max) =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= min &&
      value <= max;

    const hasLatitude = latitude !== null && latitude !== undefined;
    const hasLongitude = longitude !== null && longitude !== undefined;

    if (
      hasLatitude !== hasLongitude ||
      (hasLatitude &&
        (!validCoordinate(latitude, -90, 90) ||
          !validCoordinate(longitude, -180, 180)))
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide both valid latitude and longitude, or neither.",
      });
    }

    if (
      !Number.isInteger(resultCount) ||
      resultCount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "resultCount must be a non-negative integer.",
      });
    }

    const history = await SearchHistory.create({
      user: userId,
      query: query.trim(),
      category: category.trim() || "all",
      location: {
        latitude,
        longitude,
      },
      resultCount,
    });

    return res.status(201).json({
      success: true,
      message: "Search history saved successfully.",
      history,
    });
  } catch (error) {
    console.error("Add search history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save search history.",
    });
  }
};

// GET: Get the logged-in user's search history
const getSearchHistory = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view search history.",
      });
    }

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const history = await SearchHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Get search history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch search history.",
    });
  }
};

// DELETE: Clear all search history for the logged-in user
const clearSearchHistory = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Please log in to clear search history.",
      });
    }

    const result = await SearchHistory.deleteMany({ user: userId });

    return res.status(200).json({
      success: true,
      message: "Search history cleared successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear search history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to clear search history.",
    });
  }
};

module.exports = {
  addSearchHistory,
  getSearchHistory,
  clearSearchHistory,
};
