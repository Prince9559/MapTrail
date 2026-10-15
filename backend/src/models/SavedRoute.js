
const mongoose = require("mongoose");

const savedRouteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    origin: {
      name: {
        type: String,
        required: true,
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
    },

    destination: {
      name: {
        type: String,
        required: true,
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
    },

    distanceMeters: {
      type: Number,
      min: 0,
      default: null,
    },

    durationSeconds: {
      type: Number,
      min: 0,
      default: null,
    },

    encodedPolyline: {
      type: String,
      default: null,
    },

    travelMode: {
      type: String,
      enum: ["DRIVE", "WALK", "BICYCLE", "TRANSIT"],
      default: "DRIVE",
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedRoute", savedRouteSchema);
