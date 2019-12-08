# News-Scraper

This app allows users to view News articles, save their favorites onto another page, and comment on their favorites. Each article displayed includes a headline which is also a link to the source article and a description that includes the date of publish. There is a 'remove' button next to each article on the saved articles page, but currently it does not work. The app uses Node/Express for the server and routing, MongoDB/Mongoose for the database and models, Handlebars for the layout and views, & Cheerio/Request for scraping the data.

## Developer's Toolkit

News Scraper was built with...

```
- Front-End: HTML, CSS, Handlebars, Google Fonts, Font Awesome
- Back-end: Node, Express, Mongo DB, and npm packages Cheerio and Axios
```

# Getting Started

These instructions will get you a copy of the project up and running on your local machine for development. I will assume that you already have Node.js and MongoDB installed locally. See deployment for notes on how to deploy the project on a live system.

# Install dependencies

```
In your CLI, enter mongod
In a new CLI window, go to root of directory and enter node server.js
In browser, navigate to http://localhost:3000
```

### Dependencies

**You will need to npm install the following node modules:**

```
- express
- express-handlebars
- mongoose
- body-parser
- cheerio
- request
- npm install
```

### Deployment

```
- Follow these instructions to deploy your app live on Heroku
- Create a heroku app in your project directory
- heroku create
- Provision mLab MongoDB add-on for your project
- heroku addons:create mongolab
- Now your project should be successfully deployed on heroku.
```
