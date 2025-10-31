const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
    const { url } = req.body;
    // Reads the token from the updated .env file
    const APY_HUB_TOKEN = process.env.APY_HUB_TOKEN; 

    if (!url) {
        return res.status(400).json({ error: 'Missing article URL' });
    }

    if (!APY_HUB_TOKEN || APY_HUB_TOKEN === 'YOUR_APY_HUB_TOKEN_HERE') {
        return res.status(500).json({ error: 'ApyHub API key not configured. Please check APY_HUB_TOKEN in .env' });
    }

    try {
        // Calls the ApyHub Summarize URL API for a short summary
        const apyHubResponse = await axios.post(
            'https://api.apyhub.com/ai/summarize-url',
            {
                url: url,
                summary_length: 'short' // Max 20 words for quick preview
            },
            {
                headers: {
                    'apy-token': APY_HUB_TOKEN,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (apyHubResponse.data && apyHubResponse.data.data && apyHubResponse.data.data.summary) {
            res.json({ summary: apyHubResponse.data.data.summary });
        } else {
            console.error('ApyHub unexpected response:', apyHubResponse.data);
            res.status(502).json({ error: 'Failed to generate summary from external service.' });
        }
    } catch (error) {
        console.error('Summarization API Error:', error.message);
        const message = error.response?.data?.error || 'Failed to fetch summary from external API.';
        res.status(error.response?.status || 500).json({ error: message });
    }
});

module.exports = router;