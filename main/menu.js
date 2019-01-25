import { BrowserWindow } from 'electron'
import openAboutWindow from 'about-window'
import path from 'path'

import { productName } from '../package.json'

const iconPath = path.join(__dirname, '../static/mapfilter.png')

module.exports = function createMenuTemplate (app) {
  const template = [{
    label: 'File',
    submenu: [
      {
        label: 'Publish to Website',
        click: function () {
          var win = BrowserWindow.getFocusedWindow()
          if (win) {
            win.toggleDevTools()
            win.webContents.send('show', 'publish')
          }
        }
      },
      {
        label: 'Sync with USB...',
        click: function () {
          var win = BrowserWindow.getFocusedWindow()
          if (win) {
            win.toggleDevTools()
            win.webContents.send('show', 'sync')
          }
        }
      }
    ]
  },
  {
    label: 'Edit',
    role: 'editMenu'
  },
  {
    label: 'View',
    submenu: [{
      label: 'Reload',
      role: 'forceReload'
    }, {
      label: 'Fullscreen',
      role: 'toggleFullScreen'
    }, {
      label: 'Toggle DevTools',
      role: 'toggleDevTools'
    }]
  },
  {
    label: 'Help',
    submenu: [],
    role: 'help'
  }]

  if (process.platform === 'darwin') {
    // Menu for Mac
    template.unshift({
      label: productName,
      submenu: [
        {
          label: 'About ' + productName,
          click: () => openAboutWindow(iconPath)
        },
        {
          type: 'separator'
        },
        {
          role: 'services'
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    })

    // Window menu (Mac)
    template.splice(template.findIndex(menuItem => menuItem.label === 'View') + 1, 0, {
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          type: 'separator'
        },
        {
          role: 'front'
        }
      ]
    })
  }

  if (process.platform === 'linux' || process.platform === 'win32') {
    // Help menu (Windows, Linux)
    template.find(menuItem => menuItem.label === 'Help').submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'About ' + productName,
        click: () => openAboutWindow(iconPath)
      }
    )
  }

  // Add "File > Quit" menu item so Linux distros where the system tray icon is
  // missing will have a way to quit the app.
  if (process.platform === 'linux') {
    // File menu (Linux)
    template[0].submenu.push({
      label: 'Quit',
      click: () => app.quit()
    })
  }

  return template
}
