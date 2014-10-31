var express = require('express'),
    AWS = require('aws-sdk'),
    app = express(),
    port = (process.env.PORT || 3000),
// Grab environment variables specified in Procfile or as Heroku config vars
    username = process.env.USERNAME,
    password = process.env.PASSWORD,
    env = process.env.NODE_ENV || 'development';

if (
  (typeof process.env.AWS_ACCESS_KEY_ID === 'undefined') ||
  (typeof process.env.AWS_SECRET_ACCESS_KEY === 'undefined') ||
  (typeof process.env.AWS_REGION === 'undefined')
) {
  console.log('ERROR: Missing S3 config');
  process.exit(1);
}

var s3 = new AWS.S3();

app.configure(function(){

  // Authenticate against the environment-provided credentials, if running
  // the app in production (Heroku, effectively)
  if (env === 'production') {
    if (!username || !password) {
      console.log('Username or password is not set, exiting.');
      process.exit(1);
    }
    app.use(express.basicAuth(username, password));
  }

  app.use('/public', express.static(__dirname + '/public'));
  app.use(app.router);
  app.set('view engine', 'html');
  app.set('views', __dirname+ '/views');
  app.engine('html', require('hogan-express'));

});


var allResults = [],
list = function(bucket, callback, marker) {
  s3.listObjects(
    {
      Bucket: bucket,
      EncodingType: 'url',
      Marker: marker
    },
    function(err, data) {

      if (err) return;

      allResults = allResults.concat(data.Contents);

      if (data.IsTruncated) {
        list(bucket, callback, data.Contents.slice(-1)[0].Key);
      } else {
        callback(allResults.map(justTheKey).filter(excludeLogs));
        allResults = [];
      }

    }
  );
},
justTheKey = function(currentValue) {
  return currentValue.Key;
},
deDupe = function(item, pos, self) {
  return self.indexOf(item) == pos;
},
excludeLogs = function(item) {
  return !item.match(/^logs\/(.*)/);
},
listingBelongsToDay = function(item) {
  return item.match(new RegExp(this + '\/(.+)'));
},
getDay = function(currentValue) {
  return currentValue.split('/')[0];
},
getSupplier = function(currentValue) {
  return currentValue.split('/')[1];
},
generateOutput = function(day, index, days) {
  return {
    day: day,
    completed: this.completed.filter(listingBelongsToDay, day).length,
    drafts: this.drafts.filter(listingBelongsToDay, day).length,
    suppliers: this.allListings.filter(listingBelongsToDay, day).map(getSupplier).filter(deDupe).length
  };
},
formatListings = function(drafts, completed) {

  var allListings = drafts.concat(completed),
      days = allListings.map(getDay).filter(deDupe).sort();

  return days.map(generateOutput, {
    drafts: drafts,
    completed: completed,
    allListings: allListings
  });

};

app.get(
  "/api",
  function(req, res, next) {

    list(
      'gds-g6-completed-listings-export',
      function(completedData) {
        list(
          'gds-g6-draft-listings-export',
          function(draftsData) {

            res.json(
              formatListings(draftsData, completedData)
            );

          }
        );
      }
    );

  }
);

app.get(
  "/",
  function(req, res, next) {

    res.render('index');

  }
);

app.listen(port);
console.log('');
console.log('================================================================================');
console.log('App up, listening on port ' + port);
console.log('--------------------------------------------------------------------------------');
