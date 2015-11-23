# postcodes-data-importer

Builds a local google datastore of postcode data from OS Open Names, or imports the data to google cloud datastore.

## Building a local datastore

`docker-compose run importer`

## Importing to google cloud datastore

```
docker build -t importer .

docker run
  -e DATASTORE_HOST=https://googledatastoreuri:8080
  -e GCLOUD_PROJECT_ID=[project-id]
  -e GCLOUD_KEY=[key]
  importer
```
