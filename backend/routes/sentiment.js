// adityavk2006/news_pulse_git/News_Pulse_git-c7efdfbf7cada1a9dddd4566636c85999fe57000/backend/routes/sentiment.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Utility function for exponential backoff during API calls (keep existing)
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

// NEW: Simple sleep utility for server-side throttling
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


/* POST /sentiment - Analyze a batch of texts for sentiment */
// CHANGE: Now expects { texts: [string, string, ...] }
router.post('/', async (req, res) => {
    // 1. Validate the new input format
    const { texts } = req.body; 
    
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid array of texts to analyze' });
    }

    // FIX: Use environment variable instead of hardcoded key
    const apiKey = 'AIzaSyBQwQHupmkFjpuwlgwqiUivY-Z_f4JPJ7U'; 
    
    if (!apiKey) {
        console.error("Configuration Error: GEMINI_API_KEY is not set in environment variables.");
        // Return a 500 status to the client indicating a server-side configuration issue
        return res.status(500).json({ error: 'Server configuration error: Gemini API key missing.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`; 

    const systemPrompt = "Analyze the following news article content for its primary emotional tone (sentiment). Respond with a single integer value: '-1' for negative, '0' for neutral, or '1' for positive. Do not include any other words, punctuation, or explanations."; 

    const results = [];
    const THROTTLE_MS = 600; 

    // 2. Loop through the batch of texts
    for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        
        const payload = {
            contents: [{ parts: [{ text: text }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        let sentimentScore = 0; // Default to neutral (0)
        
        try {
            const geminiResponse = await callGeminiApi(payload, apiUrl);
            const sentimentText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            const parsedScore = parseInt(sentimentText);

            if ([-1, 0, 1].includes(parsedScore)) {
                sentimentScore = parsedScore;
            } else {
                console.warn(`Gemini returned unexpected sentiment for text ${i}:`, sentimentText);
            }
        } catch (error) {
            // FIX: Log detailed error, but still safely default to 0
            console.error(`Sentiment API Fatal Error for text ${i}:`, error.message);
            // On hard failure, sentimentScore remains 0 (neutral)
        }
        
        results.push(sentimentScore);
        
        // 3. Throttle between calls to prevent a quick rate-limit re-hit
        if (i < texts.length - 1) {
            await sleep(THROTTLE_MS);
        }
    }
    
    // 4. Respond with the array of results
    res.json({ sentiments: results });
});

module.exports = router;