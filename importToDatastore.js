'use strict';

const fs = require('fs');
const glob = require('glob');
const parse = require('csv-parse');
const through2 = require('through2');

const datastore = require('./lib/datastore');

const csvIndexes = {
  postcode: 0,
  type: 7,
  populated_place: 18,
  district: 21,
  county: 24,
  region: 27,
  country: 29
};

const isPostCodeRecord = record => {
  return record[csvIndexes.type].toLowerCase() === 'postcode';
};

const onlyPostcodes = function (data, enc, callback) {
  if (isPostCodeRecord(data)) {
    this.push(data);
  }

  callback();
};

const toDatastoreRecord = function (file) {
  return function(data, enc, callback) {
    const key = datastore.dataset.key([datastore.kind, data[csvIndexes.postcode]]);

    const record = {
      postcode: data[csvIndexes.postcode],
      place: data[csvIndexes.populated_place],
      district: data[csvIndexes.district],
      county: data[csvIndexes.county],
      region: data[csvIndexes.region],
      country: data[csvIndexes.country],
      _sourcefile: file
    };

    callback(null, {key, data: record});
  };
};

let batch = [];
const batchSize = 50;

const toDatastoreBatch = function (data, enc, callback) {
  batch.push(data);

  if (batch.length === batchSize) {
    this.push(batch);
    batch = [];
  }

  callback();
};

const flushDatastoreBatch = function (callback) {
  if (batch.length) {
    this.push(batch);
  }

  callback();
};

const addToDatastore = function (data, enc, callback, attempts) {
  attempts = attempts || 0;

  datastore.dataset.save(data, err => {
    if (err) {
      console.error('Datastore error.', err);

      if (attempts < 3) {
        attempts++;
        console.log(`Retrying [${attempts}].`);
        return addToDatastore(data, enc, callback, attempts);
      }
      else {
        return callback(err);
      }
    }

    callback();
  });
};

let result = Promise.resolve({});

glob('/var/lib/opennames/**/DATA/*.csv', (err, files) => {
  files.forEach(file => {
    result = result.then(() => {
      return new Promise(resolve => {
        console.log(`Starting import from ${file}`);

        fs.createReadStream(file)
          .pipe(parse())
          .pipe(through2.obj(onlyPostcodes))
          .pipe(through2.obj(toDatastoreRecord(file)))
          .pipe(through2.obj(toDatastoreBatch, flushDatastoreBatch))
          .pipe(through2.obj(addToDatastore, function (callback) {
            console.log(`Finished import from ${file}`);
            resolve();
            callback();
          }));
      });
    });
  });
});
