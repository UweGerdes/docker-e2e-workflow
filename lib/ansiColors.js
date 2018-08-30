/**
 * ## Replace ANSI colors with HTML style
 *
 * @module lib/log
 */

/**
 * replace color values with span style
 *
 * @param {string} string - output message
 */
function replaceAnsiColors (string) {
  let result = ''
  const replaceTable = {
    '0': 'font-weight: normal; text-decoration: none',
    '1': 'font-weight: bold',
    '4': 'text-decoration: underscore',
    '7': 'filter: reverse(100%)',
    '9': 'text-decoration: line-through',
    '30': 'color: black',
    '31': 'color: red',
    '32': 'color: green',
    '33': 'color: yellow',
    '34': 'color: blue',
    '35': 'color: magenta',
    '36': 'color: cyan',
    '37': 'color: #666666',
    '90': 'color: grey',
    '91': 'color: #ff6666',
    '92': 'color: #66ff66',
    '93': 'color: #ffff66',
    '94': 'color: #66ffff',
    '95': 'color: #ff66ff',
    '96': 'color: #66ffff',
    '97': 'color: #aaaaaa',
    '40': 'background-color: black',
    '41': 'background-color: red',
    '42': 'background-color: green',
    '43': 'background-color: yellow',
    '44': 'background-color: blue',
    '45': 'background-color: magenta',
    '46': 'background-color: cyan',
    '47': 'background-color: white'
  }
  string.toString().split(/(\u001B\[[0-9;]+m)/).forEach(function (part) {
    if (part.match(/(\u001B\[[0-9;]+m)/)) {
      part = part.replace(/\u001B\[([0-9;]+)m/, '$1')
      if (['21', '22', '24', '27', '29', '39', '49'].indexOf(part) >= 0) {
        result += '</span>'
      } else {
        result += '<span style="'
        part.split(/(;)/).forEach(function (x) {
          if (replaceTable[x]) {
            result += replaceTable[x]
          } else {
            console.log('unknown color', x)
            result += x
          }
        })
        result += '">'
      }
    } else {
      result += part
    }
  })
  return result
}

module.exports = {
  toHTML: replaceAnsiColors
}
