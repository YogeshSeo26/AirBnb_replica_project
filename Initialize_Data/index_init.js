// Initialize_Index_JS

// Here, we are writing whole logic of Database Initialization

const mongoose = require("mongoose");
const initData = require("./data_init.js");
const Listing = require("../Models/Listings_models.js");

// Mapbox Geocoding ko import karo
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');

// dotenv ko configure karna zaroori hai taaki process.env.MAP_TOKEN mil sake
require('dotenv').config({ path: '../.env' }); // Agar .env file root mein hai toh path ka dhyan rakhna

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Basic connection:- Database Created
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// Connecting Database:- now it is online MongoDB Atlas cloud
const dbUrl = process.env.ATLASDB_URL;

// Mongoose connection setup
main().then((res) => {
    console.log("Connected to DB");
    initDB();
})
.catch((err) => {
    console.log(err);
});

// Database Created with function
async function main() {
  // await mongoose.connect(MONGO_URL);
  await mongoose.connect(dbUrl);
};

// Initialize Database
const initDB = async () => {
  // await Listing.deleteMany({});

  // // this map() function will create new function, and owner property will insert in new array
  // initData.data = initData.data.map((obj) => ({...obj, owner: "6a2f05494a750d8698104fa4"}));
  // await Listing.insertMany(initData.data);
  // console.log("Data was initialized");

  // New code for assign location as per their name
    try {
        // 1. Deleting all existing data 
        await Listing.deleteMany({});
        console.log("cleared old data...");

        // 2. To get real coordinates from the mapbox, need to run this loop in every listing
        const updatedData = [];

        for (let obj of initData.data) {
            console.log(`Fetching coordinates for: ${obj.location}, ${obj.country}`);
            
            let response = await geocodingClient.forwardGeocode({
                query: `${obj.location}, ${obj.country}`,
                limit: 1
            }).send();

            // Default delhi coordinates, if coordinates not received from the mapbox
            let coords = [77.2090, 28.6139]; 
            if (response.body.features && response.body.features.length > 0) {
                coords = response.body.features[0].geometry.coordinates;
            }

            // New object where all old things like hon + owner + geometry
            updatedData.push({
                ...obj,
                owner: "6a2f05494a750d8698104fa4", // user ID
                geometry: {
                    type: "Point",
                    coordinates: coords
                }
            });
        }

        // 3. Now, inserting updated data with real coordinates
        await Listing.insertMany(updatedData);
        console.log("Data coordinates initialized!");
        
        // When work is over exit form the process
        process.exit(0);

    } catch (err) {
        console.log("Initialization error:", err);
        process.exit(1);
    }
};

// initDB();

// .................................................................................................................