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
    '0': 'none',
    '1': 'font-weight: bold',
    '4': 'text-decoration: underscore',
    '5': 'text-decoration: blink',
    '7': 'text-decoration: reverse',
    '8': 'text-decoration: concealed',
    '30': 'color: black',
    '31': 'color: red',
    '32': 'color: green',
    '33': 'color: yellow',
    '34': 'color: blue',
    '35': 'color: magenta',
    '36': 'color: cyan',
    '37': 'color: white',
    '90': 'color: grey',
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
      if (part === '39') {
        result += '</span>'
      } else {
        result += '<span style="'
        part.split(/(;)/).forEach(function (x) {
          if (replaceTable[x]) {
            result += replaceTable[x]
          } else {
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
