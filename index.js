const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const _ = require("lodash");
const cors = require('cors')
app.use(cors());
// Set the view engine to EJS
app.set("view engine", "ejs");

// Middleware for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files directory
app.use(express.static(path.join(__dirname, "public")));

// Database connection
const mongoDBUri = "mongodb+srv://admin:admin@clusterb.m4rkqzy.mongodb.net/?retryWrites=true&w=majority&appName=clusterB";
mongoose.connect(mongoDBUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Content variables
const homeContent = "Qui sono presenti tutte le note scritte";
const aboutContent = "Questo sito è stato creato da Marco Reina e Lorenzo Guerrini";
const contactContent = "Contattaci su marco.reina2@studio.unibo.it oppure lorenzo.guerrini6@studio.unibo.it";

// Mongoose schema for blogs
const noteSchema = new mongoose.Schema({
    heading: String,
    content: String, // Changed from 'Content' to 'content'
    author: String,
    date: { type: Date, default: Date.now },
    // lastModifiedDate
    categories: [String]
});

const Note = mongoose.model("Note", noteSchema);

app.get("/", async (req, res) => {
    try {
        const posts = await Note.find({});
        res.render("home", { content: homeContent, posts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching posts');
    }
});

app.get("/about", (req, res) => {
    res.render("about", { content: aboutContent });
});

app.get("/contact", (req, res) => {
    res.render("contact", { content: contactContent });
});

app.get("/compose", (req, res) => {
    res.render("compose");
});

app.post("/compose", async (req, res) => {
    const newNote = new Note({
        heading: req.body.title,
        content: req.body.post,
        author: req.body.author,
        categories: req.body.categories.split(',').map(category => category.trim()) // convert comma-separated string to array
    });
    try {
        await newNote.save();
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving post');
    }
});

// Ricordarsi di mettere route non dinamiche PRIMA di una dinamica ;) 
app.get('/search', async (req, res) => {
    if (!req.query.query) {
        return res.status(400).send('Query parameter is required');
    }

    try {
        const query = req.query.query; // This explicitly fetches the 'query' parameter from the request URL
        const searchResults = await Note.find({
            heading: { $regex: new RegExp(query, 'i') }
        }).limit(5);
        res.json(searchResults);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('Error performing search');
    }
});

// Generic routes should come after all specific routes
app.get("/posts/:postName", async (req, res) => {
    try {
        const postName = decodeURIComponent(req.params.postName);  // Explicitly decode, though Express does it
        const post = await Note.findOne({ heading: new RegExp('^' + _.escapeRegExp(postName) + '$', 'i') });
        if (post) {
            res.render("posts", {
                id : post._id,
                title: post.heading,
                post: post.content,
                author: post.author,
                date: post.date,
                categories: post.categories
            });
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching post');
    }
});

app.post('/posts/delete/:id', async (req, res) => {
    try {
        const result = await Note.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).send('Post not found');
        }
        res.redirect('/'); // Redirect to the homepage or another appropriate page
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting post');
    }
});



// Update any redirect or link that refers to this route
// For example, in your views or redirection after creating a post




// Listen on default port 3000
app.listen(3000);
