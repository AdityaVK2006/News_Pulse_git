const cron = require('node-cron');
const User = require('../models/user');
const transporter = require('../config/email'); // Use Nodemailer transporter
const newsapi = require('../config/newsapi');
const { getDailyDigestTemplate } = require('../config/emailTemplates'); // Use existing HTML template

/**
 * Fetches personalized news articles for a specific user using their preferences.
 * Uses the 'everything' endpoint for better personalization based on categories.
 */
async function getNewsForUser(user) {
  try {
    const { language, newsCount } = user.preferences;
    // Use user categories as search query, fallback to 'top headlines'
    const categoriesQuery = user.categories && user.categories.length > 0 
      ? user.categories.join(' OR ') 
      : 'top headlines'; 
      
    const response = await newsapi.v2.everything({
        q: categoriesQuery,
        language: language || 'en',
        pageSize: newsCount || 5
    });
    
    // Format the articles to match the template structure
    return response.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.urlToImage,
      source: article.source.name,
      publishedAt: article.publishedAt
    }));
  } catch (error) {
    console.error(`Error fetching news for ${user.username}:, error`);
    return [];
  }
}

/**
 * Sends a daily email with personalized news to users who have opted in.
 */
async function sendDailyEmails() {
  try {
    // Only select users who want daily emails and have notifications enabled
    const users = await User.find({ 
      'preferences.emailFrequency': 'daily', 
      emailNotifications: true 
    });
    
    if (!users || users.length === 0) {
      console.log('No users opted in for daily emails.');
      return;
    }

    // Default sender address if not set in .env
    const from = process.env.EMAIL_FROM || 'no-reply@example.com'; 
    const subject = 'Your Daily News Digest';

    for (const user of users) {
      const articles = await getNewsForUser(user);
      
      // Use the rich HTML template with the fetched articles
      const html = getDailyDigestTemplate(articles, user.username);

      const mailOptions = {
        from,
        to: user.email,
        subject,
        html
      };

      try {
        console.log(`Attempting to send email to ${user.email} from ${from}`);
        // Use Nodemailer's sendMail method
        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${user.email}, Message ID: ${result.messageId}`);
      } catch (sendErr) {
        console.error(`Failed to send email to ${user.email}:, sendErr && (sendErr.message || sendErr.toString())`);
      }
    }
  } catch (err) {
    console.error('Error while sending daily emails:', err && err.message);
  }
}

// Schedule: Uses environment variables for cron expression and timezone
const cronExpression = process.env.DAILY_EMAIL_CRON || '* 8 * * *';

const task = cron.schedule(cronExpression, () => {
  console.log('Running daily email job');
  sendDailyEmails();
}, {
  scheduled: true,
  timezone: process.env.TIMEZONE || undefined
});

module.exports = task;