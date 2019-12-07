var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");
// var bodyParser = require("body-parser");

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

//Models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
// var db = require("./models");

var PORT = process.env.PORT || 3000;

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

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
  })
);
app.set("view engine", "handlebars");

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost:27017/news-scraper", {
  useNewUrlParser: true
});

// Routes

//ROUTES TO MAIN PAGE
app.get("/", function(req, res) {
  Article.find({}, function(error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

app.get("/saved", function(req, res) {
  Article.find({ saved: true })
    .populate("notes")
    .exec(function(error, articles) {
      var hbsObject = {
        article: articles
      };
      res.render("saved", hbsObject);
    });
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  console.log("scrape data");
  axios.get("https://www.nytimes.com/section/us").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element)
        .children("div")
        .children("h2")
        .children("a")
        .text();
      result.link = $(element)
        .children("div")
        .children("h2")
        .children("a")
        .attr("href");
      result.summary = $(element)
        .children("div")
        .children("p")
        .text();
      console.log("result: ", result);
      // Create a new Article using the `result` object built from scraping
      Article.create(result)
        .then(function(data) {
          // View the added result in the console
          console.log(data);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

//////////ROUTE: CLEAR UNSAVED
app.get("/clear", function(req, res) {
  db.Article.remove({ saved: false }, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log("removed");
    }
  });
  res.redirect("/");
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  Article.find({}, function(error, data) {
    // If we were able to successfully find Articles, send them back to the client
    if (error) {
      console.log(error);
    } else {
      res.json(err);
    }
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .exec(function(error, data) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      if (error) {
        console.log(error);
      } else {
        // If an error occurred, send it to the client
        res.json(err);
      }
    });

  // Route for saving/updating an Article's associated Note
  app.post("/articles/save/:id", function(req, res) {
    console.log("saving article");
    // Use the article id to find and update its saved boolean
    Article.findOneAndUpdate({ _id: req.params.id }, { saved: true })

      // Execute the above query
      .exec(function(err, data) {
        // Log any errors
        if (err) {
          console.log(err);
        } else {
          res.send(data);
        }
      });
  });

  //////////////////////////ROUTE TO DELETE
  app.post("/articles/delete/:id", function(req, res) {
    //Anything not saved
    Article.findOneAndUpdate(
      { _id: req.params.id },
      { saved: false, notes: [] }
    ).exec(function(err, data) {
      // Log any errors
      if (err) {
        console.log(err);
      } else {
        res.send(data);
      }
    });
  });

  ////////////////////////ROUTE FOR COMMENT
  app.post("/notes/save/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note({
      body: req.body.text,
      article: req.params.id
    });
    console.log(req.body);
    // And save the new note the db
    newNote.save(function(error, note) {
      if (error) {
        console.log(error);
      } else {
        Article.findOneAndUpdate(
          { _id: req.params.id },
          { $push: { notes: note } }
        )
          /////???EXEC VS THEN???
          .exec(function(err) {
            if (err) {
              console.log(err);
              res.send(err);
            } else {
              res.send(note);
            }
          });
      }
    });
  });

  /////////////////////////ROUTE TO DELTE A NOTE
  app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
    // Use the note id to find and delete it
    Note.findOneAndRemove({ _id: req.params.note_id }, function(err) {
      // Log any errors
      if (err) {
        console.log(err);
        res.send(err);
      } else {
        Article.findOneAndUpdate(
          { _id: req.params.article_id },
          { $pull: { notes: req.params.note_id } }
        )
          // Execute the above query
          .exec(function(err) {
            // Log any errors
            if (err) {
              console.log(err);
              res.send(err);
            } else {
              // Or send the note to the browser
              res.send("Note Deleted");
            }
          });
      }
    });
  });
});
// Listen on port
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
