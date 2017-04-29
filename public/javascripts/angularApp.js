/**
 * Created by Andres on 3/22/2017.
 */
var app = angular.module('flapperNews', ['ui.router']);
/* the MainCtrl in home template does:
* - displays posts
* - those posts are made in mainFunction's $scope.posts
*   ($scope has connection to outside or home template)
* - $scope.posts stores it in posts' array in 'posts' factory
* - */
app.controller('MainCtrl', [
    '$scope',
    'posts',
    mainFunction
    ]);

app.controller('PostsCtrl', [
    '$scope',
    '$stateParams',
    'posts',
    function($scope, $stateParams, posts){
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
    }]);

//factory 'posts' similar to directive -- it makes all posts through postFunction()
app.factory('posts', [
    '$http',
    postFunction
    ]);

//creates a state for home page, posts pages etc..
app.config([
    '$stateProvider',
    '$urlRouterProvider',
    routerFunction
]);

//This function is called to store a created post in an array and returns the array
function postFunction($http) {
    var o = {
        posts: []
    };
    o.getAll = function () {
        return $http.get('/posts').success(function(data){
            angular.copy(data, o.posts);
        })
    };
    return o;
}

function mainFunction($scope, posts) {

    //assigns posts from template to $scope.post
    $scope.posts = posts.posts;

    //when button is clicked, addPost() creates a new post and store in $scope.posts array
    //which is really posts.posts array from 'post' factory
    $scope.addPost = function(){

        if(!$scope.title || $scope.title === '') { return; }

        $scope.posts.push({
            title: $scope.title,
            link: $scope.link,
            upvotes: 0,
            comments: [
                {author: 'Joe', body: 'Cool post!', upvotes: 0},
                {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
            ]
        });

        //clears out title and link coming from ng-model
        $scope.title = '';
        $scope.link = '';
    };

    //Increments 'post.upvotes' variable, this relates to
    $scope.incrementUpvotes = function(post) {
        post.upvotes += 1;
    };


}
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
            controller: 'PostsCtrl'
        });

    $urlRouterProvider.otherwise('home');
}