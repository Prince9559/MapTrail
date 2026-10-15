
const { GoogleGenAI } = require("@google/genai");

const askTravelAI = async (req, res) => {
  try {
    const { question, destination, interests, days } = req.body || {};

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a travel question.",
      });
    }

    if (question.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Question must be 2000 characters or fewer.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are MapTrail's AI travel assistant.
Help users with travel planning, destination ideas, itineraries,
sightseeing, food suggestions, and practical travel tips.

Be clear and concise. Use headings and bullet points when useful.
Do not invent current opening hours, prices, traffic, or availability.
Tell the user to verify time-sensitive details from official sources.

User question: ${question.trim()}

Destination: ${
      typeof destination === "string" ? destination.slice(0, 200) : "Not specified"
    }

Interests: ${
      typeof interests === "string" ? interests.slice(0, 500) : "Not specified"
    }

Trip duration: ${
      Number.isInteger(days) && days >= 1 && days <= 30
        ? `${days} days`
        : "Not specified"
    }
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const answer = response.text;

    if (!answer || !answer.trim()) {
      return res.status(502).json({
        success: false,
        message: "AI did not return an answer. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      answer: answer.trim(),
    });
  } catch (error) {
    console.error("Travel AI error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to generate a travel answer right now.",
    });
  }
};

module.exports = { askTravelAI };
