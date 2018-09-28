import React from 'react'
import PropTypes from 'prop-types'
import IconButton from 'material-ui/IconButton'
import SyncIcon from 'material-ui-icons/Sync'

const SyncButton = ({onClick}) => (
  <IconButton onClick={onClick}>
    <SyncIcon nativeColor='white'/>
  </IconButton>
)

SyncButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default SyncButton
