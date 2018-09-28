const getFileMetadata = require('./metadata')

module.exports = function getMediaFilename (filename, buf, opts, cb) {
  if (arguments.length === 2 && typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  getFileMetadata(buf, function (_, meta) {
    const date = meta &&
      ((meta.exif && meta.exif.DateTimeOriginal) ||
      (meta.image && meta.image.ModifyDate))
    const name = getName(filename, date || opts.lastModifiedDate)
    cb(null, name)
  })
}

function getName (filename, date) {
  if (typeof date === 'undefined') date = new Date()
  const strDate = date.toISOString().replace(/:|\./g, '_')
  return strDate + '_' + filename
  // return strDate.slice(0, 7) + '/' + strDate + '_' + filename
}
