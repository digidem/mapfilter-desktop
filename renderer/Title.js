import React from 'react'
import PropTypes from 'prop-types'
import Input from '@material-ui/core/Input'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

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

const Title = ({datasets = [], activeDataset, onChange, classes}) => (
  <div className={classes.root}>
    <Typography variant='title' color='inherit'>
      TiziiTizii {datasets.length ? <span className={classes.sep}>&nbsp;/&nbsp;</span> : ''}
    </Typography>
    {datasets.length ? <Select
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
    </Select> : null}
  </div>
)

Title.propTypes = {
  classes: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  datasets: PropTypes.arrayOf(PropTypes.string),
  activeDataset: PropTypes.string
}

export default withStyles(styles)(Title)
