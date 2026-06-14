// Listing_routes

// This is Listing, going to attach with Server File

// create express app
const express = require("express");
const router = express.Router();

// Requiring wrapAsync
const wrapAsync = require("../Utils/WrapAsync.js");

// requiring Listing model from another js file with another folder
const Listing = require("../Models/Listings_models.js");

// Requiring is Logged in function from Middleware.js file
const { isLoggedIn, isOwner, validateListing } = require("../Middlewares.js");

// Requiring Controllers
const listingController = require("../Controllers/Listings_Controllers.js");

// Requiring Multer to Parsing Form Data
const multer  = require('multer');

// Requiring Multer to uploads on localMachine
// const upload = multer({ dest: 'uploads/' }); // this is temporary to store data in local machine

// Requiring multer storage
const { storage } = require("../cloudConfig.js");

// Requiring Multer to uploads on Cloudinary
const upload = multer({ storage }); // this is for cloudinary to store data in cloud

// Route 1:- Test Listing, sample URL for testing document after adding
// router.get("/testListing", wrapAsync(async (req, res) => {
//     let sampleListing = new Listing({
//         title: "My New Villa", // String Datatype
//         description: "By the beach", // String Datatype
//         price: "1200", // Integer with String Datatype
//         location: "Calangute, Goa", // String Datatype
//         country: "India" // String Datatype
//     });
    
//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("Successful testing");
// }));

// Router.route 1:-
router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, 
        upload.single("listing[image]"), // Here, multer will process from image data to req.file
        validateListing, 
        wrapAsync(listingController.createListing)
    );

// Route 2:- CREATE (New & Create Route):- This is a New Route
// we are writing this before Router.route 2, because app.js think listings/new is a id
// basically app.js searching this new id in database and it's not being found
// that's why this new route we should write above the show route listings/id route
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Router.route 2:- Update Route
router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, 
         isOwner, 
         upload.single("listing[image]"), // Here, multer will process from image data to req.file
         validateListing, 
         wrapAsync(listingController.updateListing)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Route 6:- UPDATE (Edit & Update Route):- This is an Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// exporting Listings router object
module.exports = router;

// .......................................................................................................................