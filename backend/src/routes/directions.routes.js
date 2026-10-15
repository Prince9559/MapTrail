
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { originLat, originLng, destinationLat, destinationLng } =
            req.body || {};

        const coordinates = [
            originLat,
            originLng,
            destinationLat,
            destinationLng
        ];

        if (
            coordinates.some(
                (value) =>
                    typeof value !== "number" ||
                    !Number.isFinite(value)
            ) ||
            originLat < -90 || originLat > 90 ||
            destinationLat < -90 || destinationLat > 90 ||
            originLng < -180 || originLng > 180 ||
            destinationLng < -180 || destinationLng > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid origin and destination coordinates."
            });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "Google Maps API key is not configured."
            });
        }

        const googleResponse = await fetch(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask": [
                        "routes.distanceMeters",
                        "routes.duration",
                        "routes.polyline.encodedPolyline",
                        "routes.description"
                    ].join(",")
                },
                body: JSON.stringify({
                    origin: {
                        location: {
                            latLng: {
                                latitude: originLat,
                                longitude: originLng
                            }
                        }
                    },
                    destination: {
                        location: {
                            latLng: {
                                latitude: destinationLat,
                                longitude: destinationLng
                            }
                        }
                    },
                    travelMode: "DRIVE",
                    routingPreference: "TRAFFIC_AWARE"
                })
            }
        );

        const googleData = await googleResponse.json();

        if (!googleResponse.ok) {
            console.error(
                "Google Routes API error:",
                googleData.error?.message || "Request failed"
            );

            return res.status(502).json({
                success: false,
                message: "Google Routes API request failed.",
                details: googleData.error?.message || null
            });
        }

        const route = googleData.routes?.[0];

        if (!route) {
            return res.status(404).json({
                success: false,
                message: "No route found between these locations."
            });
        }

        const durationSeconds = Number(
            String(route.duration || "0s").replace("s", "")
        );

        return res.status(200).json({
            success: true,
            origin: {
                latitude: originLat,
                longitude: originLng
            },
            destination: {
                latitude: destinationLat,
                longitude: destinationLng
            },
            route: {
                distanceMeters: route.distanceMeters,
                distanceKm:
                    Math.round((route.distanceMeters / 1000) * 100) / 100,
                durationSeconds,
                durationMinutes: Math.ceil(durationSeconds / 60),
                durationText: `${Math.floor(durationSeconds / 3600)} hr ${Math.floor((durationSeconds % 3600) / 60)} min`,
                description: route.description || "",
                encodedPolyline:
                    route.polyline?.encodedPolyline || null
            }
        });
    } catch (error) {
        console.error("Directions API error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred while calculating the route."
        });
    }
});

module.exports = router;
