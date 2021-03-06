/**
 * Created by Andres on 3/22/2017.
 */
var app = angular.module('flapperNews', ['ui.router']);

//creates a state for home page, posts pages etc..
app.config([
    '$stateProvider',
    '$urlRouterProvider',
    routerFunction
]);
function routerFunction($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: '/home.html',
            controller: 'MainCtrl',
            resolve: {
                postPromise: ['posts', function (posts) {
                    return posts.getAll();
                }]
            }
        })
        .state('posts', {
            url: '/posts/{id}',
            templateUrl: '/posts.html',
            controller: 'PostsCtrl',
            resolve: {
                post: ['$stateParams', 'posts', function ($stateParams, posts) {
                    return posts.get($stateParams.id);
                }]
            }
        })
        .state('login', {
            url: '/login',
            templateUrl: '/login.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function($state, auth){
                if(auth.isLoggedIn()){
                    $state.go('home');
                }
            }]
        })
        .state('register', {
            url: '/register',
            templateUrl: '/register.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function($state, auth){
                if(auth.isLoggedIn()){
                    $state.go('home');
                }
            }]
        });

    $urlRouterProvider.otherwise('home');
}

/* the MainCtrl in home template does:
* - displays posts
* - those posts are made in mainFunction's $scope.posts
*   ($scope has connection to outside or home template)
* - $scope.posts stores it in posts' array in 'posts' factory
* - */
app.controller('MainCtrl', [
    '$scope',
    'posts',
    'auth',
    mainFunction
    ]);
function mainFunction($scope, posts, auth) {

    //assigns posts from template to $scope.post
    $scope.posts = posts.posts;

    //when button is clicked, addPost() creates a new post and store in $scope.posts array
    //which is really posts.posts array from 'post' factory
    $scope.addPost = function(){
        if(!$scope.title || $scope.title === '') { return; }
        /*$scope.posts.push({
         title: $scope.title,
         link: $scope.link,
         upvotes: 0,
         comments: [
         {author: 'Joe', body: 'Cool post!', upvotes: 0},
         {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
         ]
         });*/
        posts.create({
            title: $scope.title,
            link: $scope.link,
        });
        //clears out title and link coming from ng-model
        $scope.title = '';
        $scope.link = '';
    };
    //Increments 'post.upvotes' variable
    $scope.incrementUpvotes = function(post) {
        //post.upvotes += 1;
        posts.upvote(post);
    };
    //is user logged in checker
    $scope.isLoggedIn = auth.isLoggedIn;
}
app.controller('PostsCtrl', [
    '$scope',
    'posts',
    'post',
    'auth',
    /*    function($scope, $stateParams, posts){
        $scope.post = posts.posts[$stateParams.id];
        $scope.addComment = function(){
            if($scope.body === '') { return; }
            $scope.post.comments.push({
                body: $scope.body,
                author: 'user',
                upvotes: 0
            });
            $scope.body = '';
        };
    },*/
    function ($scope, posts, post, auth) {
        $scope.post = post;
        /*$scope.addComment = function(){
            if($scope.body === '') { return; }
            $scope.post.comments.push({
                body: $scope.body,
                author: 'user',
                upvotes: 0
            });
            $scope.body = '';
        };*/
        $scope.addComment = function(){
            if($scope.body === '') { return; }
            posts.addComment(post._id, {
                body: $scope.body,
                author: 'user',
            }).success(function(comment) {
                $scope.post.comments.push(comment);
            });
            $scope.body = '';
        };
        $scope.incrementUpvotes = function(comment){
            posts.upvoteComment(post, comment);
        };
        $scope.isLoggedIn = auth.isLoggedIn;
    }]);
app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function($scope, $state, auth){
        $scope.user = {};

        $scope.register = function(){
            auth.register($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };

        $scope.logIn = function(){
            auth.logIn($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };
    }]);
app.controller('NavCtrl', [
    '$scope',
    'auth',
    function($scope, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
    }]);

//factory 'posts' similar to directive -- it makes all posts through postFunction()
app.factory('posts', [
    '$http',
    'auth',
    postFunction
    ]);
/*This function does the heavy-lifting in creating, getting, and updating data through
* angular's $http service*/
function postFunction($http, auth) {
    var o = {
        posts: []
    };
    var jwtTokenJson = {
            header: { Authorization: 'Bearer ' + auth.getToken() },
        };

    o.getAll = function () {
        return $http.get('/posts').success(function(data){
            angular.copy(data, o.posts);
        })
    };
    o.create = function(post) {
        return $http.post('/posts', post, jwtTokenJson).success(function(data){
            o.posts.push(data);
        })
    };
    o.upvote = function (post) {
        return $http.put('/posts/' + post._id + '/upvote', null, jwtTokenJson)
            .success(function(data){
                post.upvotes +=1;
            });
    };
    o.get = function (id) {
        return $http.get('/posts/' + id).then(function (res) {
            return res.data;
        });
    };
    o.addComment = function (id, comment) {
        return $http.post('/posts/' + id + '/comments', comment, jwtTokenJson);
    };
    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, jwtTokenJson)
            .success(function(data){
                comment.upvotes += 1;
            });
    };

    return o;
}

/*this creates our initial auth factory*/
app.factory('auth', [$http, $window, authFunction]);
function authFunction($http, $window) {
    var auth = {};
    
    auth.saveToken = function (token) {
        $window.localStorage['flapper-news-token'] = token;
    };
    auth.getToken = function() {
        return $window.localStorage['flapper-news-token'];
    };
    auth.isLoggedIn = function () {
        var token = auth.getToken();

        if(token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };
    auth.currentUser = function(){
        if(auth.isLoggedIn()){
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        }
    };
    auth.register = function (user) {
        return $http.post('/register', user).success(function(data){
            auth.saveToken(data.token);
        });
    };
    auth.logIn = function (user) {
        return $http.post('/login', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };
    auth.logOut = function () {
       $window.localStorage.removeItem('flapper-news-token');
    }

    return auth;
}
