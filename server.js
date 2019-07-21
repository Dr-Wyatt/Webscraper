var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
let exphbs = require("express-handlebars");
var db = require("./models");

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
    db.Article.find({}, function (error, found) {
        if (error) {
            console.log(error);
        } else {
            var articlesOBJ = {
                "articles": found
            }
            console.log("this is articlesOBJ", articlesOBJ);
            res.render("frontPage", articlesOBJ);
        }

    })
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
            if ($(this).children("p").text()) {
                result.summary = $(this).children("p").text();
            } else {
                result.summary = "No Summary Available";
            }
            console.log("this is result:", result);

            // Create a new Article using the `result` object built from scraping
            if (result) {
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
        res.render("scraped");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    db.Article.find({}, function (error, found) {
        if (error) {
            console.log(error);
        } else {
            res.json(found);
        }
    })
});

app.get("/articles/:id", function (req, res) {
    // TODO
    // ====
    var id = req.params.id
    db.Article.find({ _id: id })
      .populate("note")
      .then(function (dbArticle) {
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with "note",
    // then responds with the article with the note included
  });

app.get("/comments/:id", function (req, res) {
    // TODO
    // ====
    var id = req.params.id
    if (id.match(/^[0-9a-fA-F]{24}$/)){
        db.Article.find({ _id: id })
        .populate("comments")
        .then(function (dbArticle) {
            console.log("this is dbArticle", dbArticle);
            var articlesOBJ = {
                "articles": dbArticle
            }
            console.log("this is articlesOBJ", articlesOBJ);
            res.render("articleComments", articlesOBJ);

        })
        .catch(function (err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
    } 
    // else {
    //     res.render("articleComments");
    // }
    
});



app.post("/articles/:id", function (req, res) {
    // TODO
    // ====
    // save the new note that gets posted to the Notes collection
    // then find an article from the req.params.id
    // and update it's "note" property with the _id of the new note

    var id = req.params.id
    console.log("this is the article id:", id);
    console.log("this is the body of the note:", req.body);
    db.Comments.create(req.body)
        .then(function (dbComments) {
            // If a Note was created successfully, find one User (there's only one) and push the new Note's _id to the User's `notes` array
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: id }, { $push: { comments: dbComments._id } }, { new: true });
        })
        .then(function (dbArticle) {
            // If the User was updated successfully, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
});


app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});