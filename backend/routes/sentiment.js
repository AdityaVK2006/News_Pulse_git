const express = require('express');
const axios = require('axios');
const router = express.Router();

// Utility function for exponential backoff during API calls
async function callGeminiApi(payload, apiUrl) {
    let maxRetries = 3;
    let delay = 1000;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.post(apiUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 429 && i < maxRetries - 1) {
                console.warn(`Gemini API rate limit hit. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
            } else {
                throw error;
            }
        }
    }
    throw new Error("Failed to connect to Gemini API after multiple retries.");
}

/* POST /sentiment - Analyze article text for sentiment using Gemini */
router.post('/', async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Missing text to analyze' });
    }

    const apiKey = "AIzaSyDHi-82OaEETTnGzFn5nBhFTkBVZCEKwb0"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const systemPrompt = "Analyze the following news article content for its primary emotional tone (sentiment). Respond with a single integer value: '-1' for negative, '0' for neutral, or '1' for positive. Do not include any other words, punctuation, or explanations.";

    const payload = {
        contents: [{ parts: [{ text: text }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    try {
        const geminiResponse = await callGeminiApi(payload, apiUrl);
        const sentimentText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        const sentimentScore = parseInt(sentimentText);

        if ([-1, 0, 1].includes(sentimentScore)) {
            res.json({ sentiment: sentimentScore });
        } else {
            console.warn("Gemini returned unexpected sentiment:", sentimentText);
            res.json({ sentiment: 0 }); // Default to neutral on parse failure
        }
        console.log("Sentiment analysis result:", sentimentScore);
    } catch (error) {
        console.error('Sentiment API Error:', error.message);
        res.status(500).json({ error: 'Failed to retrieve sentiment from AI service.' });
    }
});

module.exports = router;
