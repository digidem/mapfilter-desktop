import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/Add'

const AddButton = ({onClick}) => (
  <Button variant='fab' color='primary' onClick={onClick}>
    <AddIcon />
  </Button>
)

AddButton.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default AddButton
