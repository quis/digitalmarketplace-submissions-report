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


var list = function(bucket, callback) {
      s3.listObjects(
        {
          Bucket: bucket,
          EncodingType: 'url',
          //MaxKeys: 10,
          Marker: '/',
        },
        function(err, data) {

          if (err) {

            console.log(err, err.stack);

          } else {

            callback(
              data.Contents.map(justTheKey).filter(excludeLogs)
            );

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
    formatListings = function(drafts, completed) {

      var output = [],
          listings = drafts.concat(completed),
          days = listings.map(getDay).filter(deDupe).sort(),
          i, day;

      for (i in days) {

        day = days[i];

        output.push(
          {
            day: day,
            completed: completed.filter(listingBelongsToDay, day).length,
            drafts: drafts.filter(listingBelongsToDay, day).length,
            suppliers: listings.filter(listingBelongsToDay, day).map(getSupplier).filter(deDupe).length
          }
        );

      }

      return output;

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
