#docker file
FROM node:14
WORKDIR /usr/src/app
COPY ./api/package*.json ./
RUN npm install
COPY ./api/ .
EXPOSE 8888
CMD [ "node", "app.js" ]