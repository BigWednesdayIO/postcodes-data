FROM node:5.0.0

COPY . /usr/importer

WORKDIR /usr/importer

RUN npm install

CMD ["npm", "start"]
