
const express = require("express");
const router = express.Router();

const PLACE_TYPES = {
    hotels: "hotel",
    hospitals: "hospital",
    petrol_pumps: "gas_station",
    restaurants: "restaurant"
};

router.post("/nearby", async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            category = "restaurants",
            radius = 5000
        } = req.body || {};

        // Validate coordinates
        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number" ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid numeric latitude and longitude are required."
            });
        }

        // Validate category
        const placeType = PLACE_TYPES[category];

        if (!placeType) {
            return res.status(400).json({
                success: false,
                message: "Invalid category. Use hotels, hospitals, petrol_pumps, or restaurants."
            });
        }

        // Validate radius
        if (
            typeof radius !== "number" ||
            !Number.isFinite(radius) ||
            radius < 1 ||
            radius > 50000
        ) {
            return res.status(400).json({
                success: false,
                message: "Radius must be between 1 and 50000 meters."
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
            "https://places.googleapis.com/v1/places:searchNearby",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask": [
                        "places.id",
                        "places.displayName",
                        "places.formattedAddress",
                        "places.location",
                        "places.primaryType",
                        "places.rating",
                        "places.userRatingCount",
                        "places.types"
                    ].join(",")
                },
                body: JSON.stringify({
                    includedTypes: [placeType],
                    maxResultCount: 20,
                    rankPreference: "DISTANCE",
                    locationRestriction: {
                        circle: {
                            center: {
                                latitude,
                                longitude
                            },
                            radius
                        }
                    }
                })
            }
        );

        const googleData = await googleResponse.json();

        if (!googleResponse.ok) {
            console.error(
                "Nearby Places API error:",
                googleData.error?.message || "Google API request failed"
            );

            return res.status(502).json({
                success: false,
                message: "Google Places API request failed.",
                details: googleData.error?.message || null
            });
        }

        const places = (googleData.places || []).map((place) => {
            const location = place.location || {};

            return {
                id: place.id,
                name: place.displayName?.text || "Unnamed place",
                address: place.formattedAddress || "",
                latitude: location.latitude ?? null,
                longitude: location.longitude ?? null,
                primaryType: place.primaryType || null,
                types: place.types || [],
                rating: place.rating ?? null,
                userRatingCount: place.userRatingCount ?? 0
            };
        });

        return res.status(200).json({
            success: true,
            category,
            searchCenter: {
                latitude,
                longitude
            },
            radiusMeters: radius,
            count: places.length,
            places
        });

    } catch (error) {
        console.error("Nearby Places error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred while searching nearby places."
        });
    }
});


// GET Place Details by Google Place ID
router.get("/details/:placeId", async (req, res) => {
    try {
        const { placeId } = req.params;

        if (!placeId || !placeId.trim()) {
            return res.status(400).json({
                success: false,
                message: "A valid Google Place ID is required."
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
            `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
            {
                method: "GET",
                headers: {
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask": [
                        "id",
                        "displayName",
                        "formattedAddress",
                        "location",
                        "primaryType",
                        "types",
                        "rating",
                        "userRatingCount",
                        "nationalPhoneNumber",
                        "websiteUri",
                        "googleMapsUri",
                        "regularOpeningHours",
                        "currentOpeningHours",
                        "editorialSummary"
                    ].join(",")
                }
            }
        );

        const googleData = await googleResponse.json();

        if (!googleResponse.ok) {
            console.error(
                "Place Details API error:",
                googleData.error?.message || "Google API request failed"
            );

            return res.status(502).json({
                success: false,
                message: "Failed to fetch place details from Google Places API.",
                details: googleData.error?.message || null
            });
        }

        const location = googleData.location || {};

        return res.status(200).json({
            success: true,
            place: {
                id: googleData.id,
                name: googleData.displayName?.text || "Unnamed place",
                address: googleData.formattedAddress || "",
                latitude: location.latitude ?? null,
                longitude: location.longitude ?? null,
                primaryType: googleData.primaryType || null,
                types: googleData.types || [],
                rating: googleData.rating ?? null,
                userRatingCount: googleData.userRatingCount ?? 0,
                phone: googleData.nationalPhoneNumber || null,
                website: googleData.websiteUri || null,
                googleMapsUrl: googleData.googleMapsUri || null,
                openingHours: googleData.regularOpeningHours || null,
                currentOpeningHours: googleData.currentOpeningHours || null,
                summary: googleData.editorialSummary?.text || null
            }
        });
    } catch (error) {
        console.error("Place Details error:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred while fetching place details."
        });
    }
});

module.exports = router;
