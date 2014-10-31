Digital Marketplace submissions reports
=====================================
Reporting for the Digital Marketplace submissions process.

Queries the backups to see how many submitted and draft services have been
collected each day.

## Install

### Requirements

- Node
- S3 credentials

### Clone the repo
```
git clone git@github.com:quis/digitalmarketplace-submissions-report
```

### Install node modules
```
cd digitalmarketplace-submissions-report
npm install
```

### Set environment variables

e.g. `export VARIABLE=value`

#### Required

Variable | Description
-------- | -----------
`AWS_ACCESS_KEY_ID` | Access key for Amazon S3 account
`AWS_SECRET_ACCESS_KEY` | Secret key for Amazon S3 account


#### Optional

Variable | Description
-------- | -----------
`AWS_REGION` | Geographic region for AWS account, if specified
`NODE_ENV` | If set to `production` this will enable basic HTTP authentication (useful when deploying to Heroku or similar)
`USERNAME` and `PASSWORD` | Required if `NODE_ENV` is set to `production`

## Run
```
node server.js
```
or, to have the app restart when you make changes:
```
nodemon server.js
```
