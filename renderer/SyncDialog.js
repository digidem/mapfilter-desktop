import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Button from '@material-ui/core/Button'
import LinearProgress from '@material-ui/core/LinearProgress'
import { remote } from 'electron'
import mkdirp from 'mkdirp'
import path from 'path'
import { defineMessages, FormattedMessage } from 'react-intl'

const {api} = remote.require(path.resolve(__dirname, '../main/app.js'))

const messages = defineMessages({
  syncData: {
    id: 'syncData.title',
    defaultMessage: 'Synchronize data with USB',
    description: 'Title for synchronize data dialog'
  }
})

const styles = {
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
  }
}

const SelectSyncButton = ({onClick}) => (
  <Button
    style={styles.syncButton}
    onClick={onClick}
    raised
    autoFocus
    color='accent'>
    Select Sync Folder
  </Button>
)

const DoneButton = ({onClick}) => (
  <Button
    style={styles.button}
    onClick={onClick}
    raised
    autoFocus
    color='primary'>
    Done
  </Button>
)

const CancelButton = ({onClick, disabled}) => (
  <Button
    style={styles.button}
    raised
    disabled={disabled}
    onClick={onClick}>
    Cancel
  </Button>
)

const BodyActions = ({onSelectSyncFolder, onNewSyncFolder}) => (
  <div style={styles.body}>
    <SelectSyncButton onClick={onSelectSyncFolder} />
    <DialogContentText>
      or <a href='#' onClick={onNewSyncFolder}>create new sync folder</a>
    </DialogContentText>
  </div>
)

class SyncDialog extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  handleSelectSyncFolder = () => {
    const filepaths = remote.dialog.showOpenDialog(null, {
      title: 'Select Sync Folder',
      properties: ['openDirectory']
    })
    if (!filepaths || !filepaths.length) return
    this.sync(filepaths[0])
  }

  handleNewSyncFolder = () => {
    const filepath = remote.dialog.showSaveDialog(null, {
      title: 'Create New Sync Folder',
      filters: [{name: 'TiziiTizii Sync', extensions: ['tizii']}]
    })
    mkdirp.sync(filepath)
    this.sync(filepath)
  }

  handleEnter = () => {
    this.setState({
      error: null,
      progress: 0
    })
  }

  sync (dir) {
    const self = this
    api.replicateWithDirectory(dir, {progressFn: onProgress}, done)
    function done (errs) {
      if (errs) self.setState({error: errs[0]})
      self.setState({progress: 1})
    }
    function onProgress (progress) {
      self.setState({progress: progress})
    }
  }

  render () {
    let cardBody
    const {open, onRequestClose} = this.props
    const {progress} = this.state

    switch (progress) {
      case 0: // not started
        cardBody = <BodyActions
          onSelectSyncFolder={this.handleSelectSyncFolder}
          onNewSyncFolder={this.handleNewSyncFolder} />
        break
      default: // in progress
        cardBody = <LinearProgress mode='determinate' value={progress * 100} />
    }
    return <Dialog open={open} maxWidth='sm' fullWidth onRequestClose={onRequestClose} onEnter={this.handleEnter}>
      <DialogTitle>
        <FormattedMessage {...messages.syncData} />
      </DialogTitle>
      <DialogContent>
        {cardBody}
      </DialogContent>
      <DialogActions>
        {progress === 1
          ? <DoneButton onClick={onRequestClose} />
          : <CancelButton onClick={onRequestClose} disabled={progress > 0} />
        }
      </DialogActions>
    </Dialog>
  }
}

module.exports = SyncDialog
