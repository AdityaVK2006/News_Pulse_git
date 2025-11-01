const express = require('express');
const router = express.Router();
const translate = require('@iamtraction/google-translate');

// POST /translate - Accepts text and target language code
router.post('/', async (req, res) => {
    const { text, targetLang = 'en' } = req.body; 
    
    if (!text) {
        return res.status(400).json({ error: 'Missing text to translate' });
    }

    try {
        // Use 'auto' to detect source language. The targetLang comes from the modal selection.
        const result = await translate(text, { from: 'auto', to: targetLang });

        // Send back the fully translated text.
        res.json({ translatedText: result.text, originalText: text, targetLang });
    } catch (error) {
        console.error('Translation API Error:', error.message);
        // The Google Translate free service may fail if used too often, catching the error.
        res.status(500).json({ error: 'Failed to translate text via external API. (Service might be overloaded).' });
    }
});

module.exports = router;
