
const googleMapsConfig = {
  get apiKey() {
    const key = process.env.GOOGLE_MAPS_API_KEY;

    if (!key) 
    {
      throw new Error("GOOGLE_MAPS_API_KEY is missing");
    }

    return key;
  },
};

module.exports = googleMapsConfig;
