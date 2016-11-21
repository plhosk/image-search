'use strict'
require('dotenv').config()
const Promise = require('bluebird')
const getAsync = Promise.promisify(require('request').get, {multiArgs:true})
const mongo = Promise.promisifyAll(require('mongodb'))
const url = require('url')
const express = require('express')
const app = express()

const BING_SEARCH_KEY = process.env.BING_SEARCH_KEY
const MONGO_URI = process.env.MONGO_URI
const collection = 'image-search'
const searchUrl = 'https://api.cognitive.microsoft.com/bing/v5.0/images/search'
const resultsPerPage = 20


app.set('port', (process.env.PORT ||  5000))

app.get('/api/imagesearch/*', (req, res) => {
  const prefix = '/api/imagesearch/'
  const search = url.parse(req.url).pathname
    .slice(prefix.length)
    .replace('%20', '+')
  const offset = Number(url.parse(req.url, true).query.offset)

  let bingOptions = {
    uri: searchUrl,
    headers: {
      'Ocp-Apim-Subscription-Key': BING_SEARCH_KEY
    },
    qs: {
      q: search,
      mkt: 'en-us',
      count: resultsPerPage
    } 
  }
  if (isFinite(offset) && !isNaN(parseFloat(offset))) {
    bingOptions.qs.offset = offset
  }
  console.log(bingOptions)
  getAsync(bingOptions).spread((response, body) => {
    if (response.statusCode != 200) {
      throw new Error('Unsuccessful attempt. Code: ' + response.statusCode)
    }
    return JSON.parse(body)
  })
  .then(json => {
    let searchResults = json.value.map(result => {
      return {
        name: result.name,
        thumbnailUrl: result.thumbnailUrl,
        contentUrl: result.contentUrl,
        hostPageUrl: result.hostPageUrl
      }
    })
    res.send(searchResults)
  })
  .catch(console.error)

})

app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'))
})
