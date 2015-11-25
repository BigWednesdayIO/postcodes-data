'use strict';

const through2 = require('through2');
const request = require('request');

const datastore = require('./lib/datastore');

const toIndexObject = field => {
  return (entity, enc, callback) => {
    callback(null, {location: entity.data[field], type: field});
  };
};

let batch = [];
const batchSize = 50;

const toBatch = function (data, enc, callback) {
  batch.push(data);

  if (batch.length === batchSize) {
    this.push(batch);
    batch = [];
  }

  callback();
};

const flushBatch = function (callback) {
  if (batch.length) {
    this.push(batch);
    batch = [];
  }

  callback();
};

const indexBatch = (batch, enc, callback) => {
  // send to -tmp index to avoid overwriting a live/in-use index. The -tmp index can be moved after testing.
  request({
    url: `${process.env.SEARCH_API}/indexes/orderable-delivery-locations-tmp/batch`,
    method: 'POST',
    json: {requests: batch.map(body => ({action: 'create', body}))},
    headers: {
      authorization: `Bearer ${process.env.SEARCH_API_TOKEN}`
    }
  }, (err, response, body) => {
    if (err) {
      const error = new Error('Indexing error');
      error.internal = err;

      return callback(error);
    }

    if (response.statusCode != 200) {
      const error = new Error('Indexing error');
      error.http_response = body;

      return callback(error);
    }

    callback();
  });
};

const indexEntityField = field => {
  return new Promise((resolve, reject) => {
    console.log(`Starting indexing of ${field}`);
    const query = datastore.dataset.createQuery(datastore.kind).select(field).groupBy(field);

    datastore.dataset.runQuery(query)
      .on('error', err => {
        reject(err);
      })
      .pipe(through2.obj(toIndexObject(field)))
      .pipe(through2.obj(toBatch, flushBatch))
      .pipe(through2.obj(indexBatch, callback => {
        console.log(`Finished indexing of ${field}`);
        resolve();
      }))
      .on('error', err => {
        reject(err);
      });
  });
};

indexEntityField('country')
  .then(() => indexEntityField('region'))
  .then(() => indexEntityField('county'))
  .then(() => indexEntityField('district'))
  .then(() => indexEntityField('place'))
  .catch(err => {
    console.error(err);
  });
