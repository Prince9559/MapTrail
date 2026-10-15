
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const roadTripRoutes = require("./routes/roadTrip.routes");
const placesRoutes = require("./routes/places.routes");
const directionsRoutes = require("./routes/directions.routes");
const savedPlaceRoutes = require("./routes/savedPlace.routes");
const savedRouteRoutes = require("./routes/savedRoute.routes");
const historyRoutes = require("./routes/history.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MapTrail API is running",
  });
});

// Authentication APIs
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", roadTripRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/directions", directionsRoutes);
app.use("/api/saved-places", savedPlaceRoutes);
app.use("/api/saved-routes", savedRouteRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ai", aiRoutes);


app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

module.exports = app;
