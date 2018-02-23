# MapFilter Desktop

MapFilter Desktop is an _experimental_ offline-first mapping and reporting app to facilitate reporting observations in time & space of physical phenomena.

It uses [osm-p2p](https://github.com/digidem/osm-p2p-db) for offline peer-to-peer synchronization of an OpenStreetMap database, without any
servers.

This project is under active development and is still at the early prototyping phase.

# Getting Started

To clone and install all dependencies and start the program, execute

```
$ git clone git@github.com:digidem/mapfilter-desktop.git
$ cd mapfilter-desktop
$ npm install
$ npm rebuild
$ npm start
```

## Troubleshooting

Make sure that the following statements are true:

#### Python2.7 is your system's default python version.

```
$ python --version
Python 2.7.x
```

You can use virtualenv or conda, or if you don't mind changing your system
python default, you can use brute force:

```
$ ln -s `which python2` /usr/bin/python
```

On mac:
```
$ defaults write com.apple.versioner.python Version 2.7
```

#### The correct version of libtool is installed.

Sometimes it's called `glibtool`.

On Mac OSX users might see `libtool: -static is not a valid option` error. This means that `libtool` needs to be XCode's version of libtool. Make sure XCode developer tools are installed. 


```
$ which libtool
/usr/local/bin/libtool
```

If you see something from homebrew, like .../Cellar/.../libtool, then you have
the GNU version which does not have the `-static` option. You should type `brew
unlink libtool` which will re-enable the XCode version.

#### You are not developing within a `node_modules` folder.

Electron-forge and electron-prebuilt-compile can give odd behavior when
developing in a directory where there is a `node_modules` folder somewhere in
the hierarchy. Make sure you clone the repository somewhere generic, like `~/dev`.

# Development

## Packaging

MapFilter Desktop uses [Electron](http://electron.atom.io/). To package the Electron app as a native Windows `.exe` or macOS `.dmg`, execute

```
$ npm run package
```

The resultant installer or DMG will be placed in the `./dist` folder.

## Rebuilding Static Map Assets

```sh
bin/build_style.js static/map_style
```

## Creating a Release

MapFilter Desktop uses [GitHub Releases](https://help.github.com/articles/about-releases/) for deployment.

To create a release, simply push a git tag to the repository. A convenient way
to both advance the project by a version *and* push a tag is using the `npm
version` command. To create a new minor version and push it to the github
repository to initiate a build, one might run

```
$ npm version minor

$ git push --tags
```

A github release will be created automatically. Simultaneously, an
[Appveyor](appveyor.yml) build will be started to create a Windows installer,
and a [Travis](.travis.yml) build will be started for a macOS DMG. Each will be
added to the github release asynchronously as they complete.

You'll be able to find the results on the project's [releases](../../releases/) page.

## Creating Sample Observations

First, install and start [ddem-observation-server](https://github.com/digidem/ddem-observation-server).

```bash
mkdir -p data
cd data
../bin/create-sample-observations.js ../src/sample.geojson

for f in *.json; do
  curl -H "Content-Type: application/json" -d @$f http://localhost:3210/obs/create
done
```

# License

MIT
