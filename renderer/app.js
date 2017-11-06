import React from 'react'
import ReactDOM from 'react-dom'
import {addLocaleData, IntlProvider} from 'react-intl'
import enLocaleData from 'react-intl/locale-data/en'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles'
import blue from 'material-ui/colors/blue'
import pink from 'material-ui/colors/pink'

import Home from './Home'

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: pink
  }
})

addLocaleData(enLocaleData)
const locale = navigator.language.slice(0, 2)

const App = () => (
  <IntlProvider locale={locale}>
    <MuiThemeProvider theme={theme}>
      <Home />
    </MuiThemeProvider>
  </IntlProvider>
)

const div = document.createElement('div')
document.body.appendChild(div)

ReactDOM.render(<App />, div)
