var isWin = process.platform === 'win32'
var isMac = process.platform === 'darwin'
var useAsar = isWin || isMac

module.exports = {
  "make_targets": {
    "win32": [
      "squirrel"
    ],
    "darwin": [
      "zip",
      "dmg"
    ],
    "linux": [
      "deb"
    ]
  },
  "electronPackagerConfig": {
    "asar": useAsar,
    "executableName": "tizii-tizii",
    "win32metadata": {
      "CompanyName": "TiziiTizii"
    }
  },
  "electronWinstallerConfig": {},
  "electronInstallerDebian": {
    "icon": "resources/mapfilter.png",
    "categories": [
      "GNOME",
      "GTK",
      "Graphics"
    ]
  },
  "electronInstallerRedhat": {},
  "github_repository": {
    "owner": "digidem",
    "name": "mapfilter-desktop",
    "draft": false
  },
  "windowsStoreConfig": {
    "packageName": "",
    "name": "TiziiTizii"
  }
}
