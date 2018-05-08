import esStrings from 'react-mapfilter/locales/es.json'
import frStrings from 'react-mapfilter/locales/fr.json'

module.exports = function () {
  return {
    es: {
      locale: 'es',
      messages: Object.keys(esStrings).reduce((messages, id) => {
        messages[id] = esStrings[id].message
        return messages
      }, {})
    },
    fr: {
      locale: 'fr',
      messages: Object.keys(frStrings).reduce((messages, id) => {
        messages[id] = frStrings[id].message
        return messages
      }, {})
    }
  }
}
