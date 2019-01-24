import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Button from '@material-ui/core/Button'
import LinearProgress from '@material-ui/core/LinearProgress'
import { remote } from 'electron'
import log from 'electron-log'
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
    variant="contained"
    autoFocus
    color='primary'>
    Select Sync Folder
  </Button>
)

const DoneButton = ({onClick}) => (
  <Button
    style={styles.button}
    onClick={onClick}
    variant="contained"
    autoFocus
    color='primary'>
    Done
  </Button>
)

const CancelButton = ({onClick, disabled}) => (
  <Button
    style={styles.button}
    variant="contained"
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
      stage: 'not_started'
    })
  }

  sync (dir) {
    const self = this
    log.info('replicating witih dir', dir)
    // No progress option in current version
    api.replicateWithDirectory(dir, {}, done)
    self.setState({stage: 'in_progress'})
    function done (errs) {
      if (errs) {
        log.error('error with replication', errs)
        return self.setState({error: errs[0], stage: 'complete'})
      }
      log.info('Replication completed')
      self.setState({stage: 'complete'})
    }
  }

  render () {
    let cardBody
    const {open, onRequestClose} = this.props
    const {stage, error} = this.state

    switch (stage) {
      case 'not_started': // not started
        cardBody = <BodyActions
          onSelectSyncFolder={this.handleSelectSyncFolder}
          onNewSyncFolder={this.handleNewSyncFolder} />
        break
      case 'in_progress': // in progress
        cardBody = <LinearProgress />
        break
      case 'complete':
      cardBody = <LinearProgress variant='determinate' value={100} />
    }

    if (error) {
      cardBody = <div>Sorry, sync failed with an error</div>
    }
    return <Dialog open={open} maxWidth='sm' fullWidth onExit={onRequestClose} onEnter={this.handleEnter}>
      <DialogTitle>
        <FormattedMessage {...messages.syncData} />
      </DialogTitle>
      <DialogContent>
        {cardBody}
      </DialogContent>
      <DialogActions>
        {stage === 'complete'
          ? <DoneButton onClick={onRequestClose} />
          : <CancelButton onClick={onRequestClose} disabled={stage === 'in_progress'} />
        }
      </DialogActions>
    </Dialog>
  }
}

module.exports = SyncDialog
