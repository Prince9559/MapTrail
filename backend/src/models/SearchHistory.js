
const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    query: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "all",
      trim: true,
    },

    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: null,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: null,
      },
    },

    resultCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

// User ki latest searches pehle dikhengi.
searchHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("SearchHistory", searchHistorySchema);
