const NewsAPI = require('newsapi');

// Initialize News API with your API key
const newsapi = new NewsAPI(process.env.NEWS_API_KEY || '8d2247390fd147e69b07091a8323e7e4');

module.exports = newsapi;