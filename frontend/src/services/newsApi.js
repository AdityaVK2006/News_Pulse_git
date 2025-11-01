import axios from "axios";

const API_KEY = 'ba9a3ecce83441fcbef5b187282fbfd4';
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

export const fetchTopHeadlines = async (
  category = "general",
  query = "",
  country = "us"
) => {
  try {
    console.log('Fetching news with params:', { category, query, country }); // Debug log
    const res = await newsApi.get('/top-headlines', {
      params: {
        apiKey: API_KEY,
        country,
        category,
        ...(query && { q: query }),
        pageSize: 12,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    const articles = res.data.articles || [];

    // Fallback for other countries
    if (articles.length === 0) {
      let fallbackQuery = "";

      switch (country) {
        case "in":
          fallbackQuery = "India";
          break;
        case "gb":
          fallbackQuery = "United Kingdom";
          break;
        case "de":
          fallbackQuery = "Germany";
          break;
        case "jp":
          fallbackQuery = "Japan";
          break;
        default:
          fallbackQuery = "World";
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
