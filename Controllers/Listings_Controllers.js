// Listings_Controllers_JS

// Here, we are going to store all callbacks, which will work to render all listings

// requiring Listing model from another js file with another folder
const Listing = require("../Models/Listings_models.js");

const User = require("../Models/Users_models.js");

// Requiring MapBox Functionality
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');

// Accessing Map_Token
const mapToken = process.env.MAP_TOKEN;

// Creating Base Client through Using MapToken
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Function 1:-
module.exports.index = async (req, res) => {

    // 1. First, fetch the IDs of all remaining valid users from Atlas.
    const validUsers = await User.find({}, "_id");
    const validUserIds = validUsers.map(user => user._id.toString());

    // 2. AUTOMATION: Delete all listings where the owner is invalid or null.
    const cleanUpResult = await Listing.deleteMany({
        $or: [
            { owner: { $nin: validUserIds } }, // The Owner's ID does not exist in the users collection.
            { owner: null },                   // The Owner has directly become null.
            { owner: { $exists: false } }      // The Owner field itself is missing.
        ]
    });

    // If anything gets deleted on the backend, it will be visible in the terminal.
    if (cleanUpResult.deletedCount > 0) {
        console.log(`[Auto-Clean] ${cleanUpResult.deletedCount} orphaned listings automatically cleared!`);
    }

    const allListings = await Listing.find({});
    res.render("./Listings/Index.ejs", {allListings});
};

// Function 2:-
module.exports.renderNewForm = (req, res) => {
    res.render("./Listings/New.ejs");
};

// Function 3:-
module.exports.showListing = async (req, res) => {
    // Extracting id
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate( // passing an object
        {
            path: "reviews", 
            // This is nested populate object for author
            populate: {
                path: "author",
        },
    })
    .populate("owner"); // Populate means we are getting their information

    // Condition 1 :-
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    };

    res.render("Listings/Show.ejs", { listing });
};

// Function 4:-
module.exports.createListing = async (req, res, next) => {

    //  This is basic code of our Geocoding
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    })
    .send();

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing); // it will give instance

    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    // Here, we will print, whatever we will get response from the API
    newListing.geometry = response.body.features[0].geometry;

    let savedListing = await newListing.save();

    req.flash("success", "New Listing Created!");

    res.redirect("/listings");
};

//  Function 5:- Edit Form
module.exports.renderEditForm = async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);

    // Condition 1:-
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    };

    let originalImageUrl = listing.image.url; // Original / current Image
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("./Listings/Edit.ejs", { listing, originalImageUrl });
};

// Function 6:-
module.exports.updateListing = async(req, res) => {

    const { id } = req.params;

    // Update all fields except image
    const updatedListing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true, runValidators: true }
    );

    // Handle image separately
    if (req.file) {
        updatedListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await updatedListing.save();
    };

    req.flash("success", "Listing Updated!");

    res.redirect(`/listings/${id}`);
};

// Function 7:- Delete/Destroy Listing
module.exports.destroyListing = async(req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

// ..............................................................................................................