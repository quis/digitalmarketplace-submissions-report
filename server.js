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

//AWS.config.region = process.env.AWS_REGION;
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

app.get(
  "/",
  function(req, res, next) {

    res.render('index');

  }
);

app.get(
  "/api",
  function(req, res, next) {

    var justTheKey = function(currentValue) {
          return currentValue.Key;
        },
        deDupe = function(item, pos, self) {
          return self.indexOf(item) == pos;
        },
        excludeLogs = function(item) {
          return !item.match(/^logs\/(.*)/);
        },
        listingBelongsToDay = function(item) {
          return !!item.match(new RegExp(this + '\/(.+)'));
        },
        getDay = function(currentValue) {
          return currentValue.split('/')[0];
        };

    var render = function(drafts, completed){

      var output = [],
          i, days, day;

      drafts = drafts.map(justTheKey).filter(excludeLogs);
      completed = completed.map(justTheKey).filter(excludeLogs);
      days = drafts.concat(completed).map(getDay).filter(deDupe);

      for (i in days.sort()) {

        day = days[i];

        console.log('==================');
        console.log(day);
        console.log(drafts.filter(listingBelongsToDay, day));
        console.log(completed.filter(listingBelongsToDay, day));

        output.push(
          {
            name: day,
            drafts: drafts.filter(listingBelongsToDay, day).length,
            completed: completed.filter(listingBelongsToDay, day).length
          }
        );

      }

      res.json(output);

    };


    console.log('Requested: ' + req.url);

    s3.listObjects(
      {
        Bucket: 'gds-g6-completed-listings-export',
        EncodingType: 'url',
        //MaxKeys: 10,
        Marker: '/',
      },
      function(err, completedData) {

        if (err) {

          console.log(err, err.stack);

        } else {

          s3.listObjects(
            {
              Bucket: 'gds-g6-draft-listings-export',
              EncodingType: 'url',
              //MaxKeys: 10,
              Marker: '/',
            },
            function(err, draftsData) {

              if (err) {

                console.log(err, err.stack);

              } else {

                render(draftsData.Contents, completedData.Contents);

              }

            }
          );

        }

      }
    );

  }
);

app.listen(port);
console.log('S3 access key: ' + process.env.AWS_ACCESS_KEY_ID);
console.log('Listening on port ' + port);
