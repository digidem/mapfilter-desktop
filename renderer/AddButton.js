import React from 'react'
import PropTypes from 'prop-types'
import Button from 'material-ui/Button'
import AddIcon from 'material-ui-icons/Add'

const AddButton = ({onClick}) => (
  <Button color='primary' onClick={onClick}>
    <AddIcon />
  </Button>
)

AddButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default AddButton
