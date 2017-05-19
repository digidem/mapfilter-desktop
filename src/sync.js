const React = require('react')
const h = React.createElement
const { Card, CardText, CardHeader, CardActions } = require('material-ui/Card')
const RaisedButton = require('material-ui/RaisedButton').default
const remote = require('electron').remote
const path = require('path')
const api = remote.require('./app').api
const mkdirp = require('mkdirp')

const { defineMessages, FormattedMessage } = require('react-intl')

const messages = defineMessages({
  syncData: {
    id: 'syncData.title',
    defaultMessage: 'Synchronize data with USB',
    description: 'Title for synchronize data dialog'
  }
})

const styles = {
  button: {
    marginLeft: 12,
    float: 'right'
  },
  syncButton: {
    marginBottom: 18
  },
  body: {
    marginBottom: 12,
    minHeight: 100,
    display: 'flex',
    textAlign: 'center',
    padding: '12px 12px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center'
  },
  cardContainerStyle: {
    flex: 1,
    flexDirection: 'column',
    display: 'flex'
  },
  cardText: {
    overflow: 'auto'
  },
  header: {
    lineHeight: '22px',
    boxSizing: 'content-box',
    borderBottom: '1px solid #cccccc'
  },
  uploadBoxText: {
    fontWeight: 'bold',
    marginBottom: 24
  },
  card: {
    maxHeight: '100%',
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  }
}

const SelectSyncButton = ({onClick}) => (
  h(RaisedButton, {
    style: styles.syncButton,
    label: 'Select Sync Folder',
    onTouchTap: onClick,
    secondary: true
  })
)

const CloseButton = ({onClick}) => (
  h(RaisedButton, {
    style: styles.button,
    label: 'Close',
    onTouchTap: onClick,
    primary: true
  })
)

const CancelButton = ({onClick}) => (
  h(RaisedButton, {
    style: styles.button,
    onTouchTap: onClick,
    label: 'Cancel'
  })
)

const CardBody = ({onSelectSyncFolder, onNewSyncFolder}) => (
  h('div', {style: styles.body}, [
    h(SelectSyncButton, {onClick: onSelectSyncFolder}),
    h('div', {}, [
      'or ',
      h('a', {href: '#', onClick: onNewSyncFolder}, 'create new sync folder')
    ])
  ])
)

class SyncData extends React.Component {
  constructor (props) {
    super(props)
    this.handleSelectSyncFolder = this.handleSelectSyncFolder.bind(this)
    this.handleNewSyncFolder = this.handleNewSyncFolder.bind(this)
    this.state = {
      pending: null,
      error: null,
      progress: 0
    }
  }

  handleSelectSyncFolder () {
    const filepaths = remote.dialog.showOpenDialog(null, {
      title: 'Select Sync Folder',
      properties: ['openDirectory']
    })
    if (!filepaths || !filepaths.length) return
    this.sync(filepaths[0])
  }

  handleNewSyncFolder () {
    const filepath = remote.dialog.showSaveDialog(null, {
      title: 'Create New Sync Folder',
      filters: [{name: 'TiziiTizii Sync', extensions: ['tizii']}]
    })
    mkdirp.sync(filepath)
    this.sync(filepath)
  }

  sync (dir) {
    const self = this
    api.replicateWithDirectory(dir, {progressFn: onProgress}, done)
    function done (errs) {
      if (errs) self.setState({error: errs[0]})
    }
    function onProgress (progress) {
      self.setState({progress: progress})
    }
  }

  render () {
    let cardBody
    let syncState = 'pending'
    if (this.state.pending === 0) syncState = 'done'
    if (this.state.pending > 0) syncState = 'inprogress'

    switch (syncState) {
      case 'pending':
        cardBody = h(CardBody, {
          onSelectSyncFolder: this.handleSelectSyncFolder,
          onNewSyncFolder: this.handleNewSyncFolder
        })
        break
      case 'done':
        cardBody = h('div', {}, 'complete!')
        break
      case 'inprogress':
      default:
        cardBody = h('div', {}, 'progress: ' + this.state.progress)
    }
    return h(Card, {
      style: styles.card,
      containerStyle: styles.cardContainerStyle,
      zDepth: 2
    }, [
      h(CardHeader, {
        style: styles.header,
        title: h('h3', {}, h(FormattedMessage, messages.syncData))
      }),
      h(CardText, {style: styles.cardText}, cardBody),
      h(CardActions, {}, [
        h(syncState === 'done' ? CloseButton : CancelButton, {
          onClick: this.props.onCloseClick
        })
      ])
    ])
  }
}

module.exports = SyncData
