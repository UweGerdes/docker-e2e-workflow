/**
 * scripts for e2e-workflow
 */
'use strict'

/* global XMLHttpRequest */

let handler = {}

/**
 * toggle element by id
 */
handler['data-toggle'] = {
  elements: [window],
  event: 'load',
  func: () => {
    const elements = document.querySelectorAll('[data-toggle]')
    elements.forEach((element) => {
      const toggleList = document.querySelectorAll(element.dataset.toggle)
      element.addEventListener('click', () => {
        toggleList.forEach((toggled) => {
          toggled.classList.toggle('hidden')
        })
      })
      toggleList.forEach((toggled) => {
        toggled.childNodes.forEach((child) => {
          child.addEventListener('click', (event) => {
            event.stopPropagation()
          })
        })
      })
    })
  }
}

/**
 * open link
 */
handler['data-xhr'] = {
  elements: document.querySelectorAll('[data-xhr]'),
  event: 'click',
  func: function (event) {
    const element = event.target
    const response = document.querySelectorAll(element.dataset.xhrResponse)[0]
    console.log(response)
    const xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function () {
      let seenBytes = 0
      if (xhttp.readyState === 3) {
        var newData = xhttp.response.substr(seenBytes)
        console.log('newData: <<' + newData + '>>')
        response.insertAdjacentHTML('beforeEnd', newData)
        seenBytes = xhttp.responseText.length
      }
      /* data-xhr-response
      if (this.readyState === 4) {
        if (this.status === 200) {
          element.insertAdjacentHTML('beforeBegin', this.responseText)
          const selects = element.previousSibling.querySelectorAll('select[data-select-xhr]')
          if (selects.length) {
            attachEventHandler(selects[selects.length - 1], 'change',
              handler['data-select-xhr'].func)
          }
        }
      }
      */
    }
    xhttp.open('GET', element.getAttribute('data-xhr'), true)
    xhttp.send()
  }
}

/**
 * attach event to elements
 *
 * @param {DOMelement} element - to attach event
 * @param {string} event - type
 * @param {function} handler - event handler
 */
function attachEventHandler (element, event, handler) {
  if (element.attachEvent) {
    element.attachEvent('on' + event, handler)
  } else if (element.addEventListener) {
    element.addEventListener(event, handler, false)
  } else {
    element.addEventListener(event, handler, false)
  }
}

/**
 * attach event handlers
 */
Object.values(handler).forEach((handler) => {
  handler.elements.forEach((element) => {
    attachEventHandler(element, handler.event, handler.func)
  })
})