import React from 'react'
import PropTypes from 'prop-types'
import Input from 'material-ui/Input'
import { MenuItem } from 'material-ui/Menu'
import Select from 'material-ui/Select'
import Typography from 'material-ui/Typography'
import { withStyles } from 'material-ui/styles'

const styles = {
  root: {
    display: 'flex',
    alignItems: 'baseline'
  },
  sep: {
    color: 'rgba(255,255,255,0.7)'
  },
  select: {
    color: 'rgba(255,255,255,0.7)',
    '&:hover': {
      color: 'rgba(255,255,255,1)'
    }
  },
  inkbar: {
    '&:after': {
      backgroundColor: 'white'
    }
  },
  icon: {
    color: 'white'
  }
}

const Title = ({datasets, activeDataset, onChange, classes}) => (
  <Typography type='title' color='inherit' className={classes.root}>
    TiziiTizii<span className={classes.sep}>&nbsp;/&nbsp;</span>
    <Select
      value={activeDataset}
      onChange={onChange}
      MenuProps={{MenuListProps: {dense: true}}}
      classes={{
        root: classes.select,
        icon: classes.icon
      }}
      disableUnderline
      input={<Input />}>
      {datasets.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
    </Select>
  </Typography>
)

Title.propTypes = {
  classes: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  datasets: PropTypes.arrayOf(PropTypes.string),
  activeDataset: PropTypes.string
}

export default withStyles(styles)(Title)
