import React from 'react'
import PropTypes from 'prop-types'
import IconButton from 'material-ui/IconButton'
import DevicesButton from 'material-ui-icons/ImportantDevices'

const PublishButton = ({onClick}) => (
  <IconButton onClick={onClick}>
    <DevicesButton color='white' />
  </IconButton>
)

PublishButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default PublishButton
