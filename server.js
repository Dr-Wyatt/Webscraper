var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
let exphbs = require("express-handlebars");

// Require all models
// var db = require("./models");

var PORT = process.env.PORT || 9000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


app.get("/", function (req, res) {
    res.render("frontPage");
});

app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.nytimes.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $("article a").each(function (i, element) {
            // Save an empty result object
            var result = {};

            if ($(this).children('div').children('h2')
                .text() != '') {
                result.title = $(this).children('div').children('h2')
                    .text();
            } else if ($(this).children('div').children('div').children('h2')
                .text() != '') {
                result.title = $(this).children('div').children('div').children('h2')
                    .text();
            }

            if ($(this).children('div').children('h2')
                .text() != '' || $(this).children('div').children('div').children('h2')
                    .text() != '') {
                result.link = $(this).attr("href");
            }
            console.log("this is result:", result);

            // Create a new Article using the `result` object built from scraping
            if (result != null) {
                db.Article.create(result)
                    .then(function (dbArticle) {
                        // View the added result in the console
                        console.log(dbArticle);
                    })
                    .catch(function (err) {
                        // If an error occurred, log it
                        console.log(err);
                    });
            }


        });

        // Send a message to the client
        res.send("Scrape Complete");
    });
});

// // Route for getting all Articles from the db
// app.get("/articles", function (req, res) {
//     // TODO: Finish the route so it grabs all of the articles
//     db.Article.find({}, function (error, found) {
//         if (error) {
//             console.log(error);
//         } else {
//             res.json(found);
//         }
//     })
// });

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});