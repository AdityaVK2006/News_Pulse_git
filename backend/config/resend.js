const { Resend } = require('resend');

// Uses RESEND_API_KEY env var
// Set RESEND_API_KEY to your Resend API key

const apiKey = process.env.RESEND_API_KEY || "re_KEg3dHbi_EUvqMHjgn2mxByjtAZPHt3eD";
if (!apiKey) {
  console.warn('RESEND_API_KEY not set — Resend email sending will fail until you provide this env var.');
}

const resend = new Resend(apiKey);

// Test the connection
async function testResendConnection() {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',  // Resend's test address
      subject: 'Test Connection',
      html: '<p>Testing Resend connection</p>'
    });
    console.log('✅ Resend connection test successful:', result.id);
    return true;
  } catch (error) {
    console.error('❌ Resend connection test failed:', error.message);
    console.error('Please check:');
    console.error('1. Your API key is correct');
    console.error('2. You have verified your domain in Resend dashboard');
    console.error('3. You are using a valid sender email (verified domain or onboarding@resend.dev)');
    return false;
  }
}

// Test connection on startup
testResendConnection();

module.exports = resend;
