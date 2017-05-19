
const ecstatic = require('ecstatic')
const http = require('http')
const url = require('url')
const getport = require('getport')
const path = require('path')
const fs = require('fs')

module.exports = function createStyleServer (basedir) {
  const styleFile = path.join(basedir, 'style.json')

  return function (req, res) {
    if (url.parse(req.url).pathname.startsWith('/tiles')) {
      res.setHeader('content-encoding', 'gzip')
    }
    if (url.parse(req.url).pathname === '/style.json') {
      return serveStyleFile(req, res)
    }
    ecstatic({ root: root, cors: true })(req, res)
  }
}

const root = path.join(process.cwd(), argv._[0] || '')


getport(argv.port, function (err, port) {
  if (err) throw err

  http.createServer()
})

function serveStyleFile (req, res) {
  fs.stat(styleFile, function (err, stat) {
    if (err) console.error(err)
    fs.readFile(styleFile, 'utf8', function (err, data) {
      if (err) console.error(err)
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
}
