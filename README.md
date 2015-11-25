# postcodes-data-importer

Builds a local google datastore of postcode data from OS Open Names, or imports the data to google cloud datastore, and indexes location fields to the Search API.

## Building a local datastore and index to dev Search API (default settings in docker-compose.yml)

`docker-compose run importer`

## Importing to google cloud and alternative Search API

```
docker build -t postcodesimporter .

docker run \
  -e GCLOUD_PROJECT_ID=[project-id] \
  -e GCLOUD_KEY=[key] \
  -e SEARCH_API=[search-api-url] \
  -e SEARCH_API_TOKEN=[token] \
  postcodesimporter
```

* Add npm run import to above command to perform datastore import only (SEARCH_API variables not required)
* Add npm run index to above command to perform search indexing only (GCLOUD variables still required)
