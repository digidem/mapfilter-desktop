#!/usr/bin/env electron

import http from 'http'
import path from 'path'
import {app, Menu, BrowserWindow, ipcMain, dialog} from 'electron'
import Config from 'electron-store'
import mkdirp from 'mkdirp'
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer'
import getPorts from 'get-ports'
import url from 'url'
import pump from 'pump'
import websocket from 'websocket-stream'
import collect from 'collect-stream'
import JSONStream from 'JSONStream'
import isDev from 'electron-is-dev'
import MapFilterDb from 'mapfilter-db'
import createMediaServer from './media_server'
import createStyleServer from './style_server'

if (isDev) {
  require('electron-debug')()
}

if (require('electron-squirrel-startup')) app.quit()
let mainWindow = null

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

if (isSecondInstance) {
  app.quit()
  process.exit()
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit()
})

// Path to `userData`, operating system specific, see
// https://github.com/atom/electron/blob/master/docs/api/app.md#appgetpathname
var userDataPath = path.join(app.getPath('userData'), 'org.digital-democracy.MapFilter')
mkdirp.sync(userDataPath)

var appConfig = new Config()
var pending = 2

app.on('ready', onAppReady)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

var dbPath = path.join(userDataPath, 'db')
var stylePath = path.join(userDataPath, 'style')
var api = new MapFilterDb(dbPath)

const mediaServer = http.createServer(createMediaServer(api.media, '/media'))
const styleServer = http.createServer(createStyleServer(stylePath))

getPorts([8000, 8100], function (err, ports) {
  if (err) throw new Error('could not open servers')
  mediaServer.listen(ports[0])
  styleServer.listen(ports[1])
  onAppReady()
})

function getObservations (cb) {
  collect(api.observationStream().pipe(JSONStream.stringify()), cb)
}

export {appConfig, api, mediaServer, styleServer, getObservations}

function onAppReady () {
  if (--pending > 0) return

  mainWindow = setupWindow()

  if (isDev) {
    installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err))
    // installExtension(REDUX_DEVTOOLS)
    //   .then((name) => console.log(`Added Extension:  ${name}`))
    //   .catch((err) => console.log('An error occurred: ', err))
  }

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  setupMenu()

  setupFileIPCs(mainWindow, ipcMain, mainWindow.webContents)

  // if (fs.existsSync(path.join(userDataPath, 'mapfilter.mbtiles'))) {
  //   // workaround for pathnames containing spaces
  //   setupTileServer({
  //     protocol: 'mbtiles:',
  //     pathname: path.join(userDataPath, 'mapfilter.mbtiles')
  //   })
  // }

  function setupWindow () {
    var indexHtml = 'file://' + path.resolve(__dirname, '../renderer/index.html')
    var win = createWindow(indexHtml)

    win.on('close', () => appConfig.set('winBounds', win.getBounds()))

    return win
  }

  function setupMenu () {
    var template = require('./menu')(app)
    var menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  // function setupTileServer (tileUri) {
  //   console.log(tileUri, config.servers.tiles.port)
  //   tileserver(tileUri).listen(config.servers.tiles.port)
  // }
}

function createWindow (indexFile) {
  var opts = Object.assign({}, appConfig.get('winBounds'), {
    show: false,
    title: app.getName()
  })
  var win = new BrowserWindow(opts)
  win.once('ready-to-show', () => win.show())
  win.loadURL(indexFile)

  return win
}

function setupFileIPCs (window, incomingChannel, outgoingChannel) {
  incomingChannel.on('save-file', onSaveFile)
  incomingChannel.on('open-file', onOpenFile)
  incomingChannel.on('replicate-usb', onReplicateUsb)
  incomingChannel.on('replicate-server', onReplicateServer)

  function onSaveFile () {
    var ext = 'mapfilter'
    dialog.showSaveDialog(window, {
      title: 'Crear nuevo base de datos para sincronizar',
      defaultPath: 'base-de-datos.' + ext,
      filters: [
        { name: 'Mapfilter Data (*.' + ext + ')', extensions: [ext] }
      ]
    }, onSave)

    function onSave (filename) {
      if (typeof filename === 'undefined') return

      outgoingChannel.send('select-file', filename)
    }
  }

  function onOpenFile () {
    var ext = 'mapfilter'
    dialog.showOpenDialog(window, {
      title: 'Seleccionar base de datos para sincronizar',
      properties: [ 'openFile' ],
      filters: [
        { name: 'Mapfilter Data (*.' + ext + ')', extensions: [ext] }
      ]
    }, onOpen)

    function onOpen (filenames) {
      if (typeof filenames === 'undefined') return
      if (filenames.length !== 1) return

      var filename = filenames[0]
      outgoingChannel.send('select-file', filename)
    }
  }

  function onReplicateUsb () {
    var win = new BrowserWindow({
      show: false,
      title: app.getName() + ' - ' + 'Sincronización'
    })
    win.once('ready-to-show', () => win.show())
    win.loadURL('file://' + path.resolve(__dirname, 'replicate_usb.html'))
  }

  function onReplicateServer (event, server) {
    var u = url.parse(server)
    var ws = websocket('ws://' + u.host + '/osm')

    var osm = api.createOsmReplicationStream()
    pump(osm, ws, osm, (err) => {
      if (!err) appConfig.set('publish-server', server)
      var media = api.createMediaReplicationStream()
      var ws2 = websocket('ws://' + u.host + '/media')
      pump(media, ws2, media, (err) => {
        if (err) console.error('error on media replication', err)
        console.log('done replicating', err)
        event.sender.send('replicate-server-complete', err)
      })
    })
  }
}
