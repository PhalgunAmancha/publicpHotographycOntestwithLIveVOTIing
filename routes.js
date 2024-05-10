/**
 * This file defines the routes used in your application
 * It requires the database module that we wrote previously.
 */ 

var db = require('./database'),
    photos = db.photos,
    users = db.users;

module.exports = function(app){

    // Homepage
    app.get('/', function(req, res){

        // Find all photos
        photos.find({}, function(err, all_photos){

            // Find the current user
            users.find({ip: req.ip}, function(err, u){

                var voted_on = [];

                if(u.length == 1){
                    voted_on = u[0].votes;
                }

                // Find which photos the user hasn't still voted on

                var not_voted_on = all_photos.filter(function(photo){
                    return voted_on.indexOf(photo._id) == -1;
                });

                var image_to_show = null;

                if(not_voted_on.length > 0){
                    // Choose a random image from the array
                    image_to_show = not_voted_on[Math.floor(Math.random()*not_voted_on.length)];
                }

                res.render('home', { photo: image_to_show });

            });

        });

    });

    app.get('/standings', function(req, res){

        photos.find({}, function(err, all_photos){

            // Sort the photos 

            all_photos.sort(function(p1, p2){
                return (p2.likes - p2.dislikes) - (p1.likes - p1.dislikes);
            });

            // Render the standings template and pass the photos
            res.render('standings', { standings: all_photos });

        });

    });

    // This is executed before the next two post requests
    app.post('*', function(req, res, next){

        // Register the user in the database by ip address

        users.insert({
            ip: req.ip,
            votes: []
        }, function(){
            // Continue with the other routes
            next();
        });

    });

    app.post('/notcute', vote);
    app.post('/cute', vote);

    function vote(req, res){

        // Which field to increment, depending on the path

        var what = {
            '/notcute': {dislikes:1},
            '/cute': {likes:1}
        };

        // Find the photo, increment the vote counter and mark that the user has voted on it.

        photos.find({ name: req.body.photo }, function(err, found){

            if(found.length == 1){

                photos.update(found[0], {$inc : what[req.path]});

                users.update({ip: req.ip}, { $addToSet: { votes: found[0]._id}}, function(){
                    res.redirect('../');
                });

            }
            else{
                res.redirect('../');
            }

        });
    }
};