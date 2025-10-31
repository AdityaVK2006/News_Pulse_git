const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  secure: process.env.SMTP_SECURE === 'true' || false, // true for 465
  auth: {
    user: 'adityakatepallewar@gmail.com',
    pass: 'oepv mdmd oynn oawm',
  },
});

// Verify transporter (will attempt a connection when required)
transporter.verify().then(() => {
  console.log('Email transporter is ready');
}).catch(err => {
  console.warn('Email transporter verification failed:', err && err.message);
});

module.exports = transporter;
