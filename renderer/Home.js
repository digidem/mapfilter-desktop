import React from 'react'
import MapFilter from 'react-mapfilter'
import traverse from 'traverse'
import {remote} from 'electron'
import toBuffer from 'blob-to-buffer'
import assign from 'object-assign'
import diff from 'lodash/difference'
import path from 'path'
import {
  FIELD_TYPE_STRING,
  FIELD_TYPE_BOOLEAN,
  FIELD_TYPE_SPACE_DELIMITED
} from 'react-mapfilter/es5/constants'
import xor from 'lodash/xor'
import differenceBy from 'lodash/differenceBy'

import getMediaFilename from './media_filename'
import AddButton from './AddButton'
import SyncButton from './SyncButton'
import SyncDialog from './SyncDialog'
import XFormUploader from './XFormUploader'

import Title from './Title'

const {api, mediaServer, styleServer} = remote.require(path.resolve(__dirname, '../main/app.js'))

const mediaServerPort = mediaServer.address().port
const styleServerPort = styleServer.address().port

const mediaBaseUrl = `http://127.0.0.1:${mediaServerPort}/media/`
const styleUrl = `http://127.0.0.1:${styleServerPort}/style.json`

class Home extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      featuresByFormId: {
        monitoring: []
      },
      formId: 'monitoring',
      showModal: false,
      mapStyle: styleUrl
    }
    this.getFeatures()
  }

  handleAddButtonClick = () => {
    this.setState({showModal: 'add'})
  }

  handleSyncButtonClick = () => {
    this.setState({showModal: 'sync'})
  }

  handleDatasetChange = (e) => {
    this.setState({formId: e.target.value})
  }

  handleChangeFeatures = (changedFeatures) => {
    const {featuresByFormId, formId} = this.state
    const features = featuresByFormId[formId]
    const xorFeatures = xor(changedFeatures, features)
    const deleted = differenceBy(xorFeatures, changedFeatures, 'id')
    const added = differenceBy(xorFeatures, features, 'id')
    const updated = xorFeatures.filter(f => added.indexOf(f) === -1 && deleted.indexOf(f) === -1)

    deleted.forEach(f => {
      api.observationDelete(f.id, (err) => {
        if (err) console.error(err)
      })
    })
    added.forEach(f => {
      api.observationCreate(f, (err) => {
        if (err) console.error(err)
      })
    })
    updated.forEach(f => {
      api.observationUpdate(f, (err) => {
        if (err) console.error(err)
      })
    })
    const newFeaturesByFormId = assign({}, this.state.featuresByFormId)
    newFeaturesByFormId[this.state.formId] = changedFeatures
    this.setState({featuresByFormId: newFeaturesByFormId})
  }

  closeModal = () => {
    this.setState({showModal: false})
  }

  getFeatures () {
    api.observationList((err, features) => {
      if (err) return console.error(err)
      console.log(features)
      this._seen = new Set(features.map(f => f.id))
      features.forEach(function (f) {
        f = observationToFeature(f)
        f.properties = replaceProtocols(f.properties, mediaBaseUrl)
      })
      this.setState(state => ({
        featuresByFormId: features.reduce(formIdReducer, assign({}, state.featuresByFormId))
      }))
    })
  }

  uploadForm = (formData) => {
    return new Promise((resolve, reject) => {
      api.observationCreate(formData, (err, doc) => {
        if (err) return reject(err)
        if (typeof formData.properties.public === 'undefined') {
          formData.properties.public = false
        }
        if (!formData.properties.summary) {
          formData.properties.summary = ''
        }
        resolve(formData)
      })
    })
  }

  onUpload = (features) => {
    features.forEach(function (f) {
      f.properties = replaceProtocols(f.properties, mediaBaseUrl)
    })
    this.setState(state => ({
      featuresByFormId: features.reduce(formIdReducer, assign({}, state.featuresByFormId))
    }))
  }

  uploadFile = (blob, filepath) => {
    return new Promise((resolve, reject) => {
      toBuffer(blob, (err, buf) => {
        if (err) return reject(err)
        const opts = {lastModifiedDate: blob.lastModifiedDate}
        const origFilename = path.parse(filepath).base
        // Constructs a filename of the format YYYY-MM-DDTHH:MM:SS.dddZ_origFilename
        // where the date is either from EXIF headers or file modified date
        getMediaFilename(origFilename, buf, opts, function (err, filename) {
          if (err) return reject(err)
          api.mediaCreate(filename, buf, (err, id) => {
            if (err) return reject(err)
            resolve(id)
          })
        })
      })
    })
  }

  render () {
    const {featuresByFormId, formId, showModal, mapStyle} = this.state
    const toolbarTitle = <Title
      datasets={Object.keys(featuresByFormId)}
      activeDataset={formId}
      onChange={this.handleDatasetChange} />

    return (<div>
      <MapFilter
        mapStyle={styleUrl}
        features={featuresByFormId[formId] || []}
        onChangeFeatures={this.handleChangeFeatures}
        fieldTypes={{
          impacts: FIELD_TYPE_SPACE_DELIMITED,
          people: FIELD_TYPE_SPACE_DELIMITED,
          public: FIELD_TYPE_BOOLEAN,
          summary: FIELD_TYPE_STRING,
          'meta.instanceName': FIELD_TYPE_STRING
        }}
        datasetName={formId}
        fieldOrder={{
          location: 0,
          public: 1,
          summary: 2
        }}
        actionButton={<AddButton onClick={this.handleAddButtonClick} />}
        appBarButtons={[<SyncButton onClick={this.handleSyncButtonClick} />]}
        appBarTitle={toolbarTitle} />
      <SyncDialog
        open={showModal === 'sync'}
        onRequestClose={this.closeModal} />
      <XFormUploader
        open={showModal === 'add'}
        onRequestClose={this.closeModal}
        uploadForm={this.uploadForm}
        uploadFile={this.uploadFile}
        onUpload={this.onUpload} />
    </div>)
  }
}

//   // start listening to the replication stream for new features
//   const ws = websocket(`ws://${obsServer.host}:${obsServer.port}`)
//   ws.pipe(JSONStream.parse('*.value')).pipe(through.obj((obj, _, next) => {
//     if (!seen.has(obj.k)) {
//       const data = observationToFeature(obj.v)
//       seen.add(obj.k)
//       features = features.concat([data])
//       ReactDOM.render(
//         React.cloneElement(mf,
//           {
//             features,
//             mapStyle
//           }),
//         document.getElementById('root'))
//     }
//     next()
//   }))
// })
// .catch(err => console.warn(err.stack))

function formIdReducer (acc, f) {
  let formId = (f.properties.meta && f.properties.meta.formId) || 'No Form Id'
  formId = formId.replace(/_v\d+$/, '')
  if (!acc[formId]) {
    acc[formId] = [f]
  } else {
    acc[formId] = acc[formId].concat([f])
  }
  return acc
}

function replaceProtocols (obj, baseUrl) {
  return traverse(obj).map(function (value) {
    if (typeof value !== 'string') return
    var newValue = value.replace(/^mapfilter:\/\//, baseUrl)
    if (newValue !== value) {
      this.update(newValue)
    }
  })
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
  f.properties = replaceProtocols(f.properties, mediaBaseUrl)
  return feature
}


module.exports = Home
