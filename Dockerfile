FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN yarn

COPY . .

RUN mkdir uploads

RUN yarn build 

EXPOSE 3000

CMD ["yarn", "start"]