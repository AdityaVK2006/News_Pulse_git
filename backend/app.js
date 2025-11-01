var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var connectDB = require('./config/database');

// Routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var summarizeRouter = require('./routes/summarize'); // EXISTING
var translateRouter = require('./routes/translate'); // NEW IMPORT

var app = express();

// Connect to MongoDB
connectDB();

// Start scheduled jobs (daily emails)
require('./jobs/dailyEmailJob');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(cors({
  origin: 'http://localhost:5173', // frontend (Vite) port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/summarize', summarizeRouter); 
app.use('/translate', translateRouter); // MOUNT NEW ROUTE
app.use('/sentiment', require('./routes/sentiment')); // SENTIMENT ROUTE

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
