import React from 'react'
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog'

import { defineMessages, FormattedMessage } from 'react-intl'
import Button from 'material-ui/Button'
const {api} = remote.require(path.resolve(__dirname, '../main/app.js'))

const messages = defineMessages({
  publishData : {
    id: 'publishData.title',
    defaultMessage: 'Publish data to website',
    description: 'Title for publishing data dialog'
  }
})


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


const BodyActions = ({onClick}) => (
  <div style={styles.body}>
    <DialogContentText>
      or <a href='#' onClick={onNewSyncFolder}>create new sync folder</a>
    </DialogContentText>
    <input type="text" placeholder="Server URL" />
    <Button
      style={styles.syncButton}
      onClick={onClick}
      raised
      autoFocus
      color='accent'>
      Select Sync Folder
    </Button>
  </div>
)

class PublishDialog extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  handlePublishButton = () => {
  }

  render () {
    let cardBody
    const {open, onRequestClose} = this.props
    const {progress} = this.state

    switch (progress) {
      case 0: // not started
        cardBody = <BodyActions onClick={this.handlePublishButton} />
        break
      default: // in progress
        cardBody = <LinearProgress mode='determinate' value={progress * 100} />
    }
    return <Dialog open={open} maxWidth='sm' fullWidth onRequestClose={onRequestClose} onEnter={this.handleEnter}>
      <DialogTitle>
        <FormattedMessage {...messages.publishData} />
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

module.exports = PublishDialog
