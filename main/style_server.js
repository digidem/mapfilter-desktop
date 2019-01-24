const ecstatic = require('ecstatic')
const log = require('electron-log')
const url = require('url')
const path = require('path')
const fs = require('fs')
const request = require('request')
const config = require('../config.json')

const MAPBOX_DEFAULT_STYLE_URL = 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v9' +
  '?access_token=' + config.mapboxAccessToken

module.exports = function createStyleServer (basedir) {
  const styleFile = path.join(basedir, 'style.json')
  return function (req, res) {
    if (url.parse(req.url).pathname.startsWith('/tiles')) {
      res.setHeader('content-encoding', 'gzip')
    }
    if (url.parse(req.url).pathname === '/style.json') {
      return serveStyleFile(req, res)
    }
    ecstatic({ root: basedir, cors: true })(req, res)
  }

  function serveStyleFile (req, res) {
    fs.stat(styleFile, function (err, stat) {
      if (err) {
        // if we can't read the local file, try serving an online style
        log.warn('No offline style found, using online style')
        request(MAPBOX_DEFAULT_STYLE_URL)
          .on('error', error => {
            log.warn('Cannot access online style (maybe offline?)')
            if (!res.headersSent) {
              res.statusCode = 404
              res.end()
            }
          })
          .pipe(res)
          .on('error', error => {
            log.error('Unexpected error when serving style to client', error)
          })
        return
      }
      fs.readFile(styleFile, 'utf8', function (err, data) {
        if (err) return onError(err)
        data = new Buffer(data.replace(/\{host\}/gm, 'http://' + req.headers.host))
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.setHeader('last-modified', (new Date(stat.mtime)).toUTCString())
        res.setHeader('content-length', data.length)
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.statusCode = 200
        res.write(data)
        res.end()
      })
    })

    function onError (err) {
      console.error('Error serving ' + styleFile + ':', err)
      res.statusCode = 404
      res.end()
    }
  }
}
