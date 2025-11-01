import axios from "axios";

const API_KEY = 'f9203d4ea1c64c30a60c3df378972619';
const BASE_URL = 'https://newsapi.org/v2';

// Create axios instance with default config
const newsApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Supported countries (free-tier compatible)
export const SUPPORTED_COUNTRIES = [
  { code: "us", name: "United States" },
  { code: "gb", name: "United Kingdom" },
  { code: "de", name: "Germany" },
  { code: "jp", name: "Japan" },
  { code: "in", name: "India" },
];

/**
 * Simulates a reverse geocoding call using the Gemini API with Google Search grounding.
 * This is used to get a city name from the user's GPS coordinates.
 */
export const reverseGeocode = async (latitude, longitude) => {
    // We construct a highly specific query to force the LLM to give us a simple location name.
    const userQuery = `What is the closest major city to latitude ${latitude}, longitude ${longitude}? Respond with only the city name and country.`;
    const apiKey = "" 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }], 
        systemInstruction: {
            parts: [{ text: "Act as a specialized geocoding service. Extract the city and country name from search results for a given coordinate. Output ONLY the city name and country name, separated by a comma. (e.g., 'New York, USA'). DO NOT include any other text, explanation, or greeting." }]
        },
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        const cityAndCountry = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (cityAndCountry && cityAndCountry.trim().length > 0) {
            console.log("Geocoding simulation result:", cityAndCountry.trim());
            // We return the full result as the search query
            return cityAndCountry.trim();
        }
        return "World"; // Fallback query
    } catch (error) {
        console.error("Geocoding simulation failed:", error);
        return "World"; // Fallback query
    }
}


export const fetchTopHeadlines = async (
  category = "general",
  query = "",
  country = "us",
  localCity = null // NEW PARAMETER
) => {
  try {
    console.log('Fetching news with params:', { category, query, country, localCity }); 

    let endpoint = '/top-headlines';
    let params = {
      apiKey: API_KEY,
      pageSize: 12,
    };

    if (category === "local" && localCity) {
      // 1. Local News: Use 'everything' endpoint to search by city name
      endpoint = '/everything';
      params.q = localCity + " local news"; // Add 'local news' for better results
      params.language = "hi";

      params.sortBy = "publishedAt";
      // No country or category filter, rely entirely on the query
      delete params.country; 
      delete params.category; 
      
      console.log(`Fetching local news for city: ${localCity}`);

    } else if (category === "local" && !localCity) {
      // 2. Local News: Not ready to fetch yet
      return []; 
    } else if (query) {
      // 3. Search Query: Use 'everything' endpoint
      endpoint = '/everything';
      params.q = query;
      params.sortBy = "relevancy";
      delete params.country; 
      delete params.category; 
      
    } else {
      // 4. Default Category/Country: Use 'top-headlines' endpoint
      params.country = country;
      params.category = category;
    }


    const res = await newsApi.get(endpoint, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000, 
    });

    const articles = res.data.articles || [];

    // Fallback logic for top-headlines 
    if (articles.length === 0 && endpoint === '/top-headlines') {
      let fallbackQuery = "";

      switch (country) {
        case "in": fallbackQuery = "India"; break;
        case "gb": fallbackQuery = "United Kingdom"; break;
        case "de": fallbackQuery = "Germany"; break;
        case "jp": fallbackQuery = "Japan"; break;
        default: fallbackQuery = "World";
      }

      const fallback = await axios.get(`${BASE_URL}/everything`, {
        params: {
          apiKey: API_KEY,
          q: fallbackQuery,
          sortBy: "publishedAt",
          pageSize: 20,
        },
      });

      console.warn(`Using fallback 'everything' endpoint for ${fallbackQuery}`);
      return fallback.data.articles || [];
    }

    return articles;
  } catch (err) {
    console.error("News fetch error:", err);
    return [];
  }
};
