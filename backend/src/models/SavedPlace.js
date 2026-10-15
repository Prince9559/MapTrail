
const mongoose = require("mongoose");

const savedPlaceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    placeId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    category: {
      type: String,
      default: "other",
      trim: true,
    },
  },
  { timestamps: true }
);

// Ek user ek hi place ko dobara save nahi kar sakta.
savedPlaceSchema.index(
  { user: 1, placeId: 1 },
  { unique: true }
);

module.exports = mongoose.model("SavedPlace", savedPlaceSchema);
