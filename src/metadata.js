var identify = require('imghdr').what
var from = require('from2')
var jpeg = require('jpeg-marker-stream')
var through = require('through2')
var once = require('once')

module.exports = function readFileMetadata (buf, cb) {
  cb = once(cb)
  const type = identify(buf)

  if (type.indexOf('jpg') === -1) {
    return process.nextTick(cb)
  }

  let isExifRead = false
  let index = 0

  const fromBuffer = from(function (size, next) {
    if (buf.length <= index) return next(null, null)
    // If we have read EXIF, not need to read the rest of the file
    if (isExifRead) return next(null, null)
    const chunk = buf.slice(index, index + size)
    index += size
    next(null, chunk)
  })

  const parseJpegExif = jpeg()

  const readExif = through.obj(function transform (marker, enc, next) {
    if (marker.type !== 'EXIF') return next()
    isExifRead = true
    cb(null, marker)
    next(null, null)
  }, function flush () {
    if (!isExifRead) cb()
  })

  fromBuffer
    .pipe(parseJpegExif)
    .on('error', function () {
      // swallow EXIF parse errors and callback with empty metadata
      if (isExifRead) return
      isExifRead = true
      cb()
    })
    .pipe(readExif)
}
