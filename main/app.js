#!/usr/bin/env electron

import http from 'http'
import path from 'path'
import {app, Menu, BrowserWindow, ipcMain, dialog} from 'electron'
import Config from 'electron-config'
import mkdirp from 'mkdirp'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import getPorts from 'get-ports'
import isDev from 'electron-is-dev'
import createMediaServer from './media_server'
import createStyleServer from './style_server'
import Api from './api'

if (isDev) {
  require('electron-debug')()
}

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
var api = new Api(dbPath)

const mediaServer = http.createServer(createMediaServer(api.media, '/media'))
const styleServer = http.createServer(createStyleServer(stylePath))

getPorts([8000, 8100], function (err, ports) {
  if (err) throw new Error('could not open servers')
  mediaServer.listen(ports[0])
  styleServer.listen(ports[1])
  onAppReady()
})

export {api, mediaServer, styleServer}

function onAppReady () {
  if (--pending > 0) return

  var win = setupWindow()

  if (isDev) {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err))
    // installExtension(REDUX_DEVTOOLS)
    //   .then((name) => console.log(`Added Extension:  ${name}`))
    //   .catch((err) => console.log('An error occurred: ', err))
  }

  win.on('closed', function () {
    win = null
  })

  setupMenu()

  setupFileIPCs(win, ipcMain, win.webContents)

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
}
