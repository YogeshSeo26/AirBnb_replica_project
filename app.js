// app_JS

// This is main Server File

// Condition 1:- for dotenv, and we use dotenv file only in development face, 
// we do not use this in production face
if(process.env.NODE_ENV != "production") {
    // Need Require dotenv
    require('dotenv').config();
};

// Once it executed remove or comment this line
//console.log(process.env); // remove this after you've confirmed it is working

// and run this command to check if it is working
// console.log(process.env.SECRET);

// create express app
const express = require("express");
const app = express();

// Setup Mongoose connection
const mongoose = require("mongoose");

// Path requiring for EJS
const path = require("path");

// requiring method-override package after installing
const methodOverride = require("method-override");

// Requiring EJS-Mate
const ejsMate = require("ejs-mate");

// Requiring ExpressError
const ExpressError = require("./Utils/ExpressError.js");

// Requiring Express Session Package
const session = require("express-session");
const MongoStore = require("connect-mongo");

// Requiring connect-flash
const flash = require("connect-flash");

// Requiring Passport
const passport = require("passport");

// Requiring Passport-Local
const LocalStrategy = require("passport-local");

// Requiring User.js Object
const User = require("./Models/Users_models.js");

// Requiring listingRouter.js object
const listingRouter = require("./Routes/Listing_routes.js");

// Requiring reviewRouter.js object
const reviewRouter = require("./Routes/Review_routes.js");

// Requiring userRouter.js object
const userRouter = require("./Routes/User_routes.js");

// Connecting Database:- now it is online MongoDB Atlas cloud
const dbUrl = process.env.ATLASDB_URL;

// Mongoose connection setup
main().then((res) => {
    console.log("Connected to DB");
})
.catch((err) => {
    console.log(err);
});

// Database Created with function
async function main() {
    // await mongoose.connect(MONGO_URL);
    await mongoose.connect(dbUrl);
};

// These two lines code means, our views_for_EJS folder is 
// ready to save all EJS templates
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views_EJS"));

// Parsing the data - Form Data with URL-encoded
app.use(express.urlencoded({ extended: true }));

// using method-override
app.use(methodOverride("_method"));

// use ejs-locals for all ejs templates:
app.engine('ejs', ejsMate);

// using static files like CSS and JS, from where it will be served
app.use(express.static(path.join(__dirname, "Public")));

// Mongo Session Store in Atlas online cloud database
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600, 
});

// if any error get in Atlas cloud storage
store.on("error", () => {
    console.log("Error in Mongo Session Store", err);
});

// Define sessionOptions as a variable
const sessionOptions = {
    store,
    secret: process.env.SECRET, // and this secret is bad secret though we are in our development / beginner mode
    resave: false, 
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7  * 24 * 60 * 60 * 1000,
        maxAge: 7  * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// Server setup
app.listen(8080, () => {
    console.log("Server is listening to port 8080");
});

// using session Secret:- Required option
app.use(session(sessionOptions));

// using connect-flash
// and one more thing we need to use this flash before requiring any routes like listing and review
app.use(flash());

// Using Passport
app.use(passport.initialize());
app.use(passport.session());

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// using Success variable in this Middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    // console.log(res.locals.success);

    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// PASTE THIS TEMPORARY CLEAN-UP ROUTE HERE:
// app.get("/clear-all-orphaned", async (req, res) => {
//     try {
//         const Listing = require("./Models/Listings_Models.js"); // Check the correct path (Models or models)

//         // Delete directly using the actual ID visible in the terminal
//         const result = await Listing.deleteOne({ _id: "68d5100e88abe99ef5bbe309" });

//         console.log(`Force Deleted Count: ${result.deletedCount}`);
//         res.send(`<h1>Success!</h1><p>Kharab listing (ID: 68d5100e88abe99ef5bbe309) It has been deleted! Deleted Count: ${result.deletedCount}</p>`);
//     } catch (err) {
//         console.log("Force Delete Error:", err);
//         res.status(500).send("Error: " + err.message);
//     }
// });

// To use:- Requiring routes listingRouter.js object
app.use("/listings", listingRouter);

// To use:- Requiring routes reviewRouter.js object
app.use("/listings/:id/reviews", reviewRouter);

// To use:- Requiring routes userRouter.js object
app.use("/", userRouter);

// Sending Standard Response if Route not matched
app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Middleware for Handling Error which is Asynchronous
app.use((err, req, res, next) => {

    // throwing ExpressError
    let { statusCode=500, message="Something went wrong!" } = err;
    res.status(statusCode).render("Error.ejs", { message });
});

// ..............................................................................................................