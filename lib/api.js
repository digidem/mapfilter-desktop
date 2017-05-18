var path = require('path')
var through = require('through2')
var randomBytes = require('randombytes')
var mkdirp = require('mkdirp')
var level = require('level')
var osmdb = require('osm-p2p')
var osmobs = require('osm-p2p-observations')
var pump = require('pump')
var MediaStore = require('p2p-file-store')
var collect = require('collect-stream')
var sneakernet = require('hyperlog-sneakernet-replicator')
var identify = require('imghdr').what

module.exports = Api

function Api (osmdir) {
  if (!(this instanceof Api)) return new Api(osmdir)
  var mediadir = path.join(osmdir, 'media')
  mkdirp.sync(mediadir)
  var obsdb = level(path.join(osmdir, 'obsdb'))
  this.media = MediaStore(mediadir)
  this.osm = osmdb(osmdir)
  this.obs = osmobs({ db: obsdb, log: this.osm.log })
}

Api.prototype.mediaRead = function (name, cb) {
  collect(this.media.createReadStream(name), cb)
}

Api.prototype.mediaCreate = function (filename, data, opts, cb) {
  if (arguments.length === 3 && typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  const ws = this.media.createWriteStream(filename, function (err) {
    cb(err, 'mapfilter://' + filename)
  })
  ws.end(data)
}

Api.prototype.createOsmReplicationStream = function () {
  return this.osm.log.replicate()
}

Api.prototype.createMediaReplicationStream = function () {
  return this.media.replicateStream()
}

Api.prototype.replicateOsmWithFile = function (filepath, done) {
  sneakernet(this.osm.log, {safetyFile: true}, filepath, done)
}

Api.prototype.replicateMediaWithDirectory = function (dir, done) {
  this.media.replicateStore(new MediaStore(dir), done)
}

Api.prototype.observationCreate = function (feature, cb) {
  if (!(feature.type === 'Feature' && feature.properties)) {
    return cb(new Error('Expected GeoJSON feature object'))
  }
  var obs = {
    type: 'observation',
    tags: feature.properties,
    timestamp: new Date().toISOString()
  }
  if (feature.geometry && feature.geometry.coordinates) {
    obs.lon = feature.geometry.coordinates[0]
    obs.lat = feature.geometry.coordinates[1]
  }
  var id = feature.id + '' || randomBytes(8).toString('hex')
  this.osm.put(id, obs, cb)
}

Api.prototype.observationList = function (cb) {
  var features = []
  pump(this.osm.kv.createReadStream(), through.obj(write), done)

  function write (row, enc, next) {
    var values = Object.keys(row.values || {})
      .map(v => row.values[v])
    if (values.length && values[0].type === 'observation') {
      var latest = values.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0]
      features.push(observationToFeature(latest, row.key))
    }
    next()
  }

  function done (err) {
    if (err) return cb(err)
    cb(null, features)
  }
}

function observationToFeature (obs, id) {
  var feature = {
    id: id,
    type: 'Feature',
    geometry: null,
    properties: obs.tags
  }
  if (obs.lon && obs.lat) {
    feature.geometry = {
      type: 'Point',
      coordinates: [obs.lon, obs.lat]
    }
  }
  return feature
}
