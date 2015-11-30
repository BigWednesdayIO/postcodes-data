FROM node:5.0.0

RUN apt-get update && \
    apt-get install zip -y

RUN cd /var/lib && \
    wget https://storage.googleapis.com/os-open-names/opennames.zip && \
    unzip opennames.zip && \
    rm opennames.zip && \
    cd opennames && \
    for i in *.zip; do target="${i%.zip}" && mkdir "$target" && unzip "$i" -d "$target" && rm "$i"; done

COPY . /usr/local/importer

WORKDIR /usr/local/importer

RUN npm install

CMD ["npm", "start"]
