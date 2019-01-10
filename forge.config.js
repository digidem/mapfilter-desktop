var semver = require('semver')

var isWin = process.platform === 'win32'
var isMac = process.platform === 'darwin'
var useAsar = isWin || isMac

var isPrerelease = !!semver.prerelease(process.env.TRAVIS_TAG)

var ignore = [
  '/node_modules(?:/|.*)(?:test|__tests__|tests|powered-test|example|examples)(?:$|/)',
  '/node_modules/.*\\.d\\ts$',
  '/node_modules(?:/|.*)(?:CHANGELOG.md|README.md|README|readme.md|readme)(?:$|/)',
  '.*/(:?appveyor\\.yml|travis\\.yml|circle\\.yml)$',
  '.*/(:?__pycache__|thumbs\\.db|\\.flowconfig|\\.idea,\\.vs|\\.nyc_output)(?:$|/)'
]

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
    "asar": useAsar && {
      "unpackDir": "**/node_modules/sharp/**/*"
    },
    "executableName": "tizii-tizii",
    "extraResource": "resources/launcher.sh",
    "icon": "static/mapfilter",
    "ignore": ignore,
    "win32metadata": {
      "CompanyName": "Digital Democracy"
    }
  },
  "electronWinstallerConfig": {
    "exe": "tizii-tizii.exe"
  },
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
  }
}
