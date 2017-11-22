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
var fs = require('fs')

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

Api.prototype.replicateWithDirectory = function (dir, opts, done) {
  var pending = 2
  var errs = []
  var dataPath = path.join(dir, 'data.tgz')
  var mediaPath = path.join(dir, 'media')

  sneakernet(this.osm.log, {safetyFile: true}, dataPath, onFinished)
  this.media.replicateStore(new MediaStore(mediaPath), opts, onFinished)

  function onFinished (err) {
    if (err) errs.push(err)

    if (--pending === 0) {
      var txt = 'DO NOT MODIFY ANYTHING INSIDE THIS FOLDER PRETTY PLEASE'
      fs.writeFile(path.join(dir, 'DO NOT MODIFY.txt'), txt, 'utf8', onWritten)

      function onWritten (err) {
        if (err) errs.push(err)
        done(errs.length ? errs : null)
      }
    }
  }
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

Api.prototype.observationDelete = function (id, cb) {
  this.osm.del(id, cb)
}

Api.prototype.observationUpdate = function (feature, cb) {
  this.observationCreate(feature, cb)
}

Api.prototype.observationList = function (cb) {
  var features = []
  pump(this.osm.kv.createReadStream(), through.obj(write), done)

  function write (row, enc, next) {
    var values = Object.keys(row.values || {})
      .map(v => row.values[v])
    if (values.length && values[0].type === 'observation') {
      // var latest = values.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0]
      features.push(observationToFeature(values[0], row.key))
    }
    next()
  }

  function done (err) {
    if (err) return cb(err)
    features = JSON.stringify(features)
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
  if (typeof feature.properties.public === 'undefined') {
    feature.properties.public = false
  }
  if (!feature.properties.summary) {
    feature.properties.summary = ' '
  }
  return feature
}
