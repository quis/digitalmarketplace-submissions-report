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

app.get(
  "/api",
  function(req, res, next) {

    console.log(req.query);

    s3.listObjects(
      {
        Bucket: req.query.bucket,
        EncodingType: 'url',
        Marker: req.query.marker
      },
      function(err, data) {
        res.json(data);
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
