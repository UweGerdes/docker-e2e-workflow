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
    response.innerHTML = ''
    const xhttp = new XMLHttpRequest()
    let seenBytes = 0
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 3) {
        var newData = xhttp.responseText.substr(seenBytes)
        seenBytes = xhttp.responseText.length
        response.insertAdjacentHTML('beforeEnd', newData)
        response.scrollTop = response.scrollHeight - response.clientHeight
      }
      if (xhttp.readyState === 4) {
        response.insertAdjacentHTML('beforeEnd', '<br /><a href="javascript:location.reload()" class="button">CLOSE</a>')
        response.scrollTop = response.scrollHeight - response.clientHeight
      }
    }
    xhttp.open('GET', element.getAttribute('data-xhr'), true)
    xhttp.send()
  }
}

/**
 * build canvas for color picking
 */
function buildCanvas() {
  const img = document.querySelector('.image-container img.screenshot')
  const canvas = document.querySelector('canvas#imgCanvas')
  canvas.width = img.width
  canvas.height = img.height
  const canvasContext = canvas.getContext("2d")
  canvasContext.fillStyle = "#FFFFFF"
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);
  canvasContext.drawImage(img, 0, 0)
}

/**
 * toggle element by id
 */
handler['data-click-color'] = {
  elements: [window],
  event: 'load',
  func: () => {
    const element = document.querySelector('[data-click-color]')
    const canvas = document.querySelector('canvas#imgCanvas')
    const canvasContext = canvas.getContext("2d")
    const colorOutput = document.querySelector(element.dataset.clickColor)
    const positionOutput = document.querySelector('.mouse-position-output')
    buildCanvas();
    element.addEventListener('click', (e) => {
      const rect = e.target.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left); //x position within the element.
      const y = Math.round(e.clientY - rect.top);  //y position within the element.
      const pix = canvasContext.getImageData(x, y, 1, 1)
      console.log(element.dataset.clickColor, x, y, pix.data[0], pix.data[1], pix.data[2], pix.data[3])
      colorOutput.textContent = '#' + rgb2hex([pix.data[0], pix.data[1], pix.data[2]])
      positionOutput.textContent = 'x:' + x + ', y:' + y
    })
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

function rgb2hex(colorArray) {
  let hex = ''
  colorArray.forEach((color) => {
    console.log(color)
    hex += componentToHex(color)
  })
  return hex.toUpperCase()
}

function componentToHex(c) {
  let hex = c.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}
