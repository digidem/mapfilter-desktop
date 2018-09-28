import React from 'react'
import Snackbar from '@material-ui/core/Snackbar';

class PositionedSnackbar extends React.Component {

  state = {
    open: false
  }

  handleClose = state => () => {
    this.setState({open: false})
  }

  render () {
    var { message } = this.props
    var { open } = this.state

    return (
      <Snackbar
      anchorOrigin={{vertical: 'center', horizontal: 'center'}}
      open={open || !!message}
      onClose={this.handleClose}
      ContentProps={{
        'aria-describedby': 'message-id',
      }}
      message={<span id="message-id">{message}</span>}
    />
    )
  }
}

module.exports = PositionedSnackbar
