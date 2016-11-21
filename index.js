'use strict'
require('dotenv').config()
const Promise = require('bluebird')
Promise.longStackTraces();
const getAsync = Promise.promisify(require('request').get, {multiArgs:true})
const mongo = require('mongodb')
const url = require('url')
const express = require('express')
const app = express()
const marked = require('marked')
const readFileAsync = Promise.promisify(require('fs').readFile)

const BING_SEARCH_KEY = process.env.BING_SEARCH_KEY
const MONGO_URI = process.env.MONGO_URI
const mongoCollection = 'image-search'
const searchUrl = 'https://api.cognitive.microsoft.com/bing/v5.0/images/search'
const resultsPerPage = 20
const maxSavedResults = 10


app.set('port', (process.env.PORT ||  5000))

// Send README.md
app.get('/', (req, res) => {
  readFileAsync('./README.md', 'utf8').then((data) => {
    res.send(marked(data))
  })
  .catch((err) => {
    console.error('ERROR' + err)
  })
})

app.get('/api/latest/imagesearch*', (req, res) => {
  mongo.MongoClient.connect(MONGO_URI, {
    promiseLibrary: Promise
  }).then((db) => {    
    const collection = db.collection(mongoCollection)
    return collection.find(
      {},
      { _id: 0, search: 1, unixtime: 1 }
    ).toArray().then((docs) => {
      res.send(docs)
    })
    .finally(() => {
      db.close()
    })
  })
  .catch((err) => {
    console.error('ERROR', err)
  })
})

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
  //console.log(bingOptions)

  mongo.MongoClient.connect(MONGO_URI, {
    promiseLibrary: Promise
  }).then((db) => {
    const collection = db.collection(mongoCollection)
    return collection.count().then((number) => {
      number -= maxSavedResults
      if ( number >= 0) {
        return collection.findOneAndDelete(
          {},
          { sort: { unixtime: 1 } }
        )
      } else return Promise.resolve()
    })
    .then(() => {
      return collection.insertOne({
        search,
        unixtime: Math.floor(Date.now() / 1000)
      })
    })
    .finally(() => {
      db.close()
    })
  })
  .catch(err => {
    console.error('ERROR', err)
  })

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
