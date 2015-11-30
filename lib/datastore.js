'use strict';

const gcloud = require('gcloud');

const projectId = process.env.GCLOUD_PROJECT_ID;
const credentials = process.env.GCLOUD_KEY;

module.exports.dataset = gcloud.datastore.dataset({
  projectId,
  credentials: JSON.parse(new Buffer(credentials, 'base64').toString('ascii'))
});

module.exports.kind = 'Postcode';
