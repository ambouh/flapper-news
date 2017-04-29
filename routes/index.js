var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;


/*import mongoose framework that gives us the models, next is models 'Post' and 'Comment'*/
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

/*creates a GET route for retreiving all posts*/
router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

/*creates a POST request: this request the database to make a new post into our database*/
router.post('/posts', function(req, res, next) {
  var post = new Post(req.body);

  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

/*Rather than replicating the same code across several different request handler functions,
we can use Express's param() function to automatically load an object.
- when a route URL with :post requested, this function will run first (because of the query interface)
*/
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  /*mongoose's query interface provides a flexible way of interacting with db*/
  query.exec(function (err, post) {
    if(err){return next(err);}
    if (!post) {return next(new Error('Can\'t find post'));}

    //- once the post with ID is retrieved, it's attached to the 'req' object
    req.post = post;

    //I think returning next() chains the next function to run
    return next();
  });
});

/*using the route URL /posts/:post, the param() function triggers first to query the json with id provided
* - param() executes the next function
* - */
router.get('/posts/:post', function (req, res) {
   res.json(req.post);
});


/*allows us to upvote a post */
router.put('/posts/:post/upvote', function(req, res, next) {
  req.post.upvote(function (err, post) {
    if(err) {return next(err);}

    res.json(post);
  });
});