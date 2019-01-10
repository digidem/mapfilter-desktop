var semver = require('semver')

var isWin = process.platform === 'win32'
var isMac = process.platform === 'darwin'
var useAsar = isWin || isMac

var isPrerelease = !!semver.prerelease(process.env.TRAVIS_TAG)

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
    },
    "extraResource": "resources/launcher.sh"
  },
  "electronWinstallerConfig": {},
  "electronInstallerDebian": {
    "icon": "static/mapfilter.png",
    "categories": [
      "GNOME",
      "GTK",
      "Graphics"
    ],
    "bin": "resources/launcher.sh"
  },
  "electronInstallerRedhat": {},
  "github_repository": {
    "owner": "digidem",
    "name": "mapfilter-desktop",
    "draft": false,
    "prerelease": isPrerelease
  },
  "windowsStoreConfig": {
    "packageName": "",
    "name": "TiziiTizii"
  }
}
