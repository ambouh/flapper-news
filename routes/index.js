var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express=jwt');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;


/*import mongoose framework that gives us the models, next is models 'Post' and 'Comment'*/
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

//Creating middleware for authenticating jwt tokes
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/*Rather than replicating the same code across several different request handler functions,
we can use Express's param() function to automatically load an object.
- when a route URL with :post requested, this function will run first (because of the query interface)*/
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
/*implement router.param() to retrieve specific 'comment' */
// Preload comment objects on routes with ':comment'
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("can't find comment")); }

    req.comment = comment;
    return next();
  });
});

/*creates a GET route for retreiving all posts*/
router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

/*creates a POST request: this request the database to make a new post into our database*/
router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;
  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});
/*creates a user that has username and password */
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;
  user.setPassword(req.body.password);

  user.save(function(err){
    if(err){return next(err);}

    return res.json({token: user.generateJWT()})
  });
})
/*authenticates ther user and returns a token to the client*/
router.post('/login', function (req, res, next) {
  if(!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function (err, user, info) {
    if(err){return next(err);}

    if(user){
      return(res.json({token: user.generateJWT()}));
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
})

/*using the route URL /posts/:post, the param() function triggers first to query the json with id provided
* - param() executes the next function */
router.get('/posts/:post', function (req, res) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});
/*allows us to upvote a post */
router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function (err, post) {
    if(err) {return next(err);}

    res.json(post);
  });
});
/*creates new post comment*/
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});
/*updates the upvote on a post comment*/
router.put('/posts/:post/comments/:comment/upvote', auth, function(req,res,next){
  req.comment.upvote(function (err, comment) {
    if(err) {return next(err);}

    res.json(comment);
  });
});



