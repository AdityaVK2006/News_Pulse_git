const getDailyDigestTemplate = (articles, username) => {
    const articlesList = articles.map(article => `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
            ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.title}" style="max-width: 100%; height: auto; margin-bottom: 10px;">` : ''}
            <h2 style="margin: 0 0 10px 0; color: #333;">${article.title}</h2>
            <p style="color: #666; margin: 0 0 10px 0;">${article.description || ''}</p>
            <p style="color: #888; margin: 0 0 10px 0;">Source: ${article.source}</p>
            <a href="${article.url}" style="background-color: #007bff; color: white; padding: 8px 15px; text-decoration: none; border-radius: 3px; display: inline-block;">Read More</a>
        </div>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Your Daily News Digest</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Your Daily News Digest</h1>
            <p style="color: #666;">Hello ${username},</p>
            <p style="color: #666;">Here are today's top headlines based on your preferences:</p>
            
            <div style="margin: 30px 0;">
                ${articlesList}
            </div>
            
            <p style="color: #666; margin-top: 30px;">
                To manage your email preferences, please visit your profile settings.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 12px;">
                    This email was sent to you as part of your daily news digest subscription.
                    <br>
                    To unsubscribe, update your email preferences in your profile.
                </p>
            </div>
        </body>
        </html>
    `;
};

module.exports = {
    getDailyDigestTemplate
};