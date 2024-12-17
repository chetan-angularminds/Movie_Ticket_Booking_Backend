const mongoose = require("mongoose");
const Movie = require("./models/Movie"); // Import your movie model

async function updatePosterUrls(currentHostUrl) {
    const oldHostUrl = "http://localhost:3000"; // Replace with the old URL used locally

    try {
        const result = await Movie.updateMany(
            { poster: { $regex: `^${oldHostUrl}` } }, // Match posters starting with oldHostUrl
            [
                {
                    $set: {
                        poster: {
                            $replaceOne: {
                                input: "$poster",
                                find: oldHostUrl,
                                replacement: currentHostUrl,
                            },
                        },
                    },
                },
            ]
        );
        console.log(`Updated ${result.modifiedCount} poster URLs.`);
    } catch (error) {
        console.error("Error updating poster URLs:", error);
    }
}

module.exports = {update: updatePosterUrls}