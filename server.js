'use strict';
(function () {
  var app, cache, compress, cors, etag, fresh, getIds, getObject, koa, limit, logger, markdown, mask, oneDay, oneMonth, oneYear, ratelimit, response_time, router, serve

  koa = require('koa')
  response_time = require('koa-response-time')
  logger = require('koa-logger')
  cors = require('koa-cors')
  etag = require('koa-etag')
  fresh = require('koa-fresh')
  compress = require('koa-compress')
  mask = require('koa-json-mask')
  router = require('koa-router')
  markdown = require('koa-markdown')
  serve = require('koa-static')
  getIds = require('./libs/getIds')
  getObject = require('./libs/getObject')
  app = koa()

  console.log('Environment:' + app.env)

  cache = ratelimit = function () {
    return function * (next) {
      return (yield next)
    }
  }

  if (app.env !== 'development') {
    console.log('cache ON')
    cache = require('koa-redis-cache')
    oneDay = 60 * 60 * 24
    oneMonth = oneDay * 30
    oneYear = oneDay * 365
    console.log('limits ON')
    limit = require('koa-better-ratelimit')
    ratelimit = function (next) {
      return limit({
        duration: 1000 * 60,
        max: 8
      })
    }
  }

  app.use(response_time())
  app.use(logger())
  app.use(cors())
  app.use(etag())
  app.use(fresh())
  app.use(compress())
  app.use(serve('static'))
  app.use(mask())
  app.use(router(app))

  app.get('/', markdown({
    baseUrl: '/',
    root: __dirname,
    indexName: 'Readme'
  }))

  app.get('/object/:id', cache({
    expire: oneYear
  }), ratelimit(), getObject)

  app.get('/search/:term', cache({
    expire: oneMonth
  }), ratelimit(), getIds)

  app.get('/search', cache({
    expire: oneMonth
  }), ratelimit(), getIds)

  app.get('/random', require('./libs/getRandom'))

  app.listen(process.env.PORT || 5000, function () {
    return console.log(`[${process.pid}] listening on :${+this._connectionKey.split(':')[2]}`)
  })
}).call(this)
