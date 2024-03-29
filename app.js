// Import configuration in .env file
require('dotenv').config();
// Import Basic Packages
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// Import More Packages
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
// Import Modules
const randomGenerator = require("./routes/utils/randomGenerator");
// Import Routers
const indexRouter = require('./routes/index');
const adminsRouter = require('./routes/admins');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const signupRouter = require('./routes/signup');


const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Use basic functions
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Use more functions
app.use(methodOverride("_method"));

/**
 * Express middleware for adding session functionality.
 *
 * @function
 * @param {object} session - An session object
 * @param {string|function} session.secret - The session secret, which can be a string or a function for generating the secret.
 * @param {boolean} [session.resave=false] - Whether to force the session to be saved on every request.
 * @param {boolean} [session.saveUninitialized=true] - Whether to initialize the session on every request.
 */
app.use(session({
  secret: randomGenerator(),
  resave: false,
  saveUninitialized: true,
}))

/**
 * Middleware function to verify whether a user is logged in or not.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function to be called.
 */
const loginverify = (req, res, next) => {
  // Check if the user is verified by checking the `isVerified` flag in the session.
  if (req.session.isVerifed) {
    // If the user is verified, call the next middleware function in the chain.
    next();
  } else {
    // If the user is not verified, redirect them to the login page.
    res.redirect("login");
  }
};

// Import MongoDB parameters
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST;
const dbUserName = process.env.DB_USER_NAME;
const dbPassword = process.env.DB_PASSWORD;
// Set the URI of MongoDB Atlas
const uri = `mongodb+srv://${dbUserName}:${dbPassword}@${dbHost}/${dbName}?retryWrites=true&w=majority`;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB Atlas Cluster.");
  })
  .catch((e) => {
    console.log("MongoDB Atlas Cluster Connection Failed.");
    console.log(e);
  });

// Mounting routers to handle different API requests
app.use('/', indexRouter);
app.use('/users', loginverify, adminsRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/signup', signupRouter);

// catch /favicon.ico with 1x1 transparent GIF
app.get("/favicon.ico", (req, res) => {
  res.setHeader("Content-Type", "image/gif");
  res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
