var mime = require('mime')

function serveFile (req, res, filepath, media, next) {
  var r = media.createReadStream(filepath)
  r.once('error', function (err) {
    console.error('Error serving ' + filepath + ':', err)
    res.statusCode = 404
    res.end()
  })
  res.setHeader('content-type', mime.lookup(filepath))
  r.pipe(res)
}

module.exports = function (media, root) {
  root = root.replace(/\/$/, '') || ''
  const rootRegExp = new RegExp('^' + root + '/')
  var handler = function (req, res, next) {
    if (!req.url.startsWith(root)) return next()
    if (req.method !== 'GET') return next()
    var filepath = req.url.replace(rootRegExp, '')
    serveFile(req, res, filepath, media, next)
  }
  return handler
}
