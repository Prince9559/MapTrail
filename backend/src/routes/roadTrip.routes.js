
const express = require("express");
const router = express.Router();
const { decode } = require("@googlemaps/polyline-codec");

// Convert Google duration, e.g. "120s", into seconds.
const durationToSeconds = (duration) => {
    return Number(String(duration || "0s").replace("s", ""));
};

// Calculate distance between two [latitude, longitude] points.
const getDistance = (point1, point2) => {
    const toRadians = (degrees) => degrees * Math.PI / 180;

    const lat1 = point1[0];
    const lng1 = point1[1];
    const lat2 = point2[0];
    const lng2 = point2[1];

    const earthRadius = 6371000;

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) ** 2;

    return earthRadius * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
};

// Find a point halfway along the route.
const getHalfwayPoint = (points, totalRouteDistance) => {
    if (!points || points.length === 0) {
        throw new Error("Route polyline has no points");
    }

    const halfwayDistance = totalRouteDistance / 2;
    let travelledDistance = 0;

    for (let i = 1; i < points.length; i++) {
        travelledDistance += getDistance(points[i - 1], points[i]);

        if (travelledDistance >= halfwayDistance) {
            return points[i];
        }
    }

    return points[points.length - 1];
};

// Common category words and synonyms.
// Google Places types are used only where they are known to be useful.
const categoryMap = [
    {
        keywords: ["it company", "it companies", "software company",
            "software companies", "software development", "tech company",
            "technology company", "web development", "software agency"],
        types: ["software_company"]
    },
    {
        keywords: ["hospital", "hospitals"],
        types: ["hospital"]
    },
    {
        keywords: ["petrol pump", "petrol pumps", "gas station",
            "fuel station", "fuel stations"],
        types: ["gas_station"]
    },
    {
        keywords: ["hotel", "hotels"],
        types: ["hotel"]
    },
    {
        keywords: ["restaurant", "restaurants"],
        types: ["restaurant"]
    },
    {
        keywords: ["pharmacy", "pharmacies", "medical store",
            "medical stores", "chemist", "chemists"],
        types: ["pharmacy"]
    },
    {
        keywords: ["school", "schools"],
        types: ["school"]
    },
    {
        keywords: ["college", "colleges", "university", "universities"],
        types: ["university", "college"]
    },
    {
        keywords: ["atm", "atms"],
        types: ["atm"]
    },
    {
        keywords: ["bank", "banks"],
        types: ["bank"]
    }
];

// Match known categories using place types, name and query synonyms.
// For unrecognized/free-form queries, retain Google's text-search results.

const getCategoryMatch = (place, query) => {
    const normalizedQuery = query.toLowerCase().trim();

    const placeTypes = place.types || [];
    const primaryType = place.primaryType || "";

    const searchableText = [
        place.displayName?.text || "",
        place.formattedAddress || "",
        primaryType,
        ...placeTypes
    ].join(" ").toLowerCase();

    const categoryMap = [
        {
            keywords: [
                "it company", "it companies", "software company",
                "software companies", "software development",
                "tech company", "technology company",
                "web development", "software agency"
            ],
            
relevantWords: [
    "software",
    "technology",
    "technologies",
    "web development",
    "software development",
    "it services",
    "information technology",
    "computer software",
    "software solutions",
    "tech solutions"
],

            types: ["software_company"]
        },
        {
            keywords: ["hospital", "hospitals"],
            relevantWords: ["hospital"],
            types: ["hospital"]
        },
        {
            keywords: [
                "petrol pump", "petrol pumps",
                "gas station", "fuel station", "fuel stations"
            ],
            relevantWords: ["gas_station", "fuel"],
            types: ["gas_station"]
        },
        {
            keywords: ["hotel", "hotels"],
            relevantWords: ["hotel", "lodging"],
            types: ["hotel"]
        },
        {
            keywords: ["restaurant", "restaurants"],
            relevantWords: ["restaurant", "food"],
            types: ["restaurant"]
        }
    ];

    const category = categoryMap.find((item) =>
        item.keywords.some((keyword) =>
            normalizedQuery.includes(keyword)
        )
    );

    // For other free-form searches, let Google Places decide relevance.
    if (!category) {
        return { recognized: false, matches: true };
    }

    const matchesType = category.types.some((type) =>
        placeTypes.includes(type) || primaryType === type
    );

    const matchesRelevantWord = category.relevantWords.some((word) =>
        searchableText.includes(word)
    );

    return {
        recognized: true,
        matches: matchesType || matchesRelevantWord
    };
};


router.post("/road-trip/search", async (req, res) => {
    try {
        const {
            originLat,
            originLng,
            destinationLat,
            destinationLng,
            query,
            maxDetourMinutes = 30
        } = req.body || {};

        // Validate request body.
        const coordinates = [
            originLat, originLng, destinationLat, destinationLng
        ];

        if (
            coordinates.some((value) =>
                typeof value !== "number" || !Number.isFinite(value)
            ) ||
            originLat < -90 || originLat > 90 ||
            destinationLat < -90 || destinationLat > 90 ||
            originLng < -180 || originLng > 180 ||
            destinationLng < -180 || destinationLng > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid numeric origin and destination coordinates."
            });
        }

        if (typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a search query, e.g. IT companies, hospitals or petrol pumps."
            });
        }

        if (
            typeof maxDetourMinutes !== "number" ||
            !Number.isFinite(maxDetourMinutes) ||
            maxDetourMinutes < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "maxDetourMinutes must be a non-negative number."
            });
        }

        if (!process.env.GOOGLE_MAPS_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Google Maps API key is not configured."
            });
        }

        // Step 1: Get the main driving route.
        const routeResponse = await fetch(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask":
                        "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline"
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

        const routeData = await routeResponse.json();

        if (!routeResponse.ok) {
            return res.status(routeResponse.status).json({
                success: false,
                message: "Google Routes API request failed.",
                details: routeData
            });
        }

        const route = routeData.routes?.[0];

        if (!route?.polyline?.encodedPolyline) {
            return res.status(404).json({
                success: false,
                message: "No route found."
            });
        }

        const distanceMeters = route.distanceMeters;
        const originalRouteDuration = durationToSeconds(route.duration);
        const encodedPolyline = route.polyline.encodedPolyline;

        // Step 2: Calculate the halfway point.
        const decodedPoints = decode(encodedPolyline);
        const halfwayPoint = getHalfwayPoint(
            decodedPoints,
            distanceMeters
        );

        const halfwayLatitude = halfwayPoint[0];
        const halfwayLongitude = halfwayPoint[1];

        // Step 3: Search places along the route.
        const placesResponse = await fetch(
            "https://places.googleapis.com/v1/places:searchText",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": [
                        "places.id",
                        "places.displayName",
                        "places.formattedAddress",
                        "places.location",
                        "places.rating",
                        "places.userRatingCount",
                        "places.primaryType",
                        "places.types",
                        "routingSummaries"
                    ].join(",")
                },
                body: JSON.stringify({
                    textQuery: query.trim(),
                    pageSize: 20,
                    searchAlongRouteParameters: {
                        polyline: {
                            encodedPolyline
                        }
                    },
                    locationRestriction: {
                        rectangle: {
                            low: {
                                latitude: Math.max(-90, halfwayLatitude - 0.25),
                                longitude: Math.max(-180, halfwayLongitude - 0.25)
                            },
                            high: {
                                latitude: Math.min(90, halfwayLatitude + 0.25),
                                longitude: Math.min(180, halfwayLongitude + 0.25)
                            }
                        }
                    },
                    routingParameters: {
                        origin: {
                            latitude: originLat,
                            longitude: originLng
                        },
                        travelMode: "DRIVE",
                        routingPreference: "TRAFFIC_AWARE"
                    }
                })
            }
        );

        const placesData = await placesResponse.json();

        if (!placesResponse.ok) {
            return res.status(placesResponse.status).json({
                success: false,
                message: "Google Places API request failed.",
                details: placesData
            });
        }

        // Step 4: Calculate detour while preserving the original
        // place index so each place uses its own routing summary.
        const placesWithDetour = (placesData.places || [])
            .map((place, index) => {
                const routingSummary =
                    placesData.routingSummaries?.[index];

                const firstLeg = routingSummary?.legs?.[0];
                const secondLeg = routingSummary?.legs?.[1];

                if (!firstLeg || !secondLeg) {
                    return null;
                }

                const firstLegSeconds = durationToSeconds(firstLeg.duration);
                const secondLegSeconds = durationToSeconds(secondLeg.duration);

                const totalWithStop = firstLegSeconds + secondLegSeconds;
                const detourSeconds = totalWithStop - originalRouteDuration;
                const detourMinutes = Math.round(detourSeconds / 60);

                const rating = place.rating || 0;
                const reviewCount = place.userRatingCount || 0;

                const categoryMatch = getCategoryMatch(place, query);
                
                if (categoryMatch.recognized && !categoryMatch.matches) {
                 return null;
                }


                const categoryBonus =
                    categoryMatch?.recognized && categoryMatch.matches
                        ? 30
                        : 0;

                const score =
                    (rating * 20) +
                    Math.min(reviewCount / 100, 20) -
                    detourMinutes +
                    categoryBonus;

                return {
                    id: place.id,
                    name: place.displayName?.text || "Unnamed place",
                    address: place.formattedAddress || "",
                    primaryType: place.primaryType || null,
                    types: place.types || [],
                    rating,
                    userRatingCount: reviewCount,
                    detourMinutes,
                    score: Math.round(score)
                };
            })
            .filter(Boolean);

        // Step 5: Apply maximum detour filter.
        // Negative detour values are retained, as in the original logic.
        const filteredPlaces = placesWithDetour.filter((place) =>
            place.detourMinutes <= maxDetourMinutes
        );

        // Step 6: Sort by score, highest first.
        filteredPlaces.sort((a, b) => b.score - a.score);

        // Step 7: Send response.
        return res.json({
            success: true,
            halfwayPoint: {
                latitude: halfwayLatitude,
                longitude: halfwayLongitude
            },
            route: {
                distanceMeters,
                durationToSeconds: originalRouteDuration
            },
            places: filteredPlaces
        });

    } catch (err) {
        console.error("Road-trip search error:", err.message);

        return res.status(500).json({
            success: false,
            message: err.message || "An unexpected error occurred."
        });
    }
});

module.exports = router;
