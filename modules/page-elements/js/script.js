/**
 * Scripts for page elements
 *
 * @module modules/page-elements/js/script
 */

'use strict';

let handlers = {};

/**
 * toggle element by id
 *
 * @name data-toggle
 */
handlers['data-toggle'] = {
  elements: [window],
  event: 'load',
  func: () => {
    const elements = document.querySelectorAll('[data-toggle]');
    elements.forEach((element) => {
      const toggleList = document.querySelectorAll(element.dataset.toggle);
      element.addEventListener('click', () => {
        toggleList.forEach((toggled) => {
          toggled.classList.toggle('hidden');
        });
      });
      toggleList.forEach((toggled) => {
        toggled.childNodes.forEach((child) => {
          child.addEventListener('click', (event) => {
            event.stopPropagation();
          });
        });
      });
    });
  }
};

/**
 * send request and show response in target element
 *
 * @name data-xhr
 */
handlers['data-xhr'] = {
  elements: document.querySelectorAll('[data-xhr]'),
  event: 'click',
  func: function (event) {
    const element = event.target;
    const container = document.querySelectorAll(element.dataset.xhrResponse)[0];
    container.innerHTML = '';
    const xhttp = new XMLHttpRequest();
    let seenBytes = 0;
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState === 3) {
        var newData = xhttp.responseText.substr(seenBytes);
        seenBytes = xhttp.responseText.length;
        container.insertAdjacentHTML('beforeEnd', newData);
        container.scrollTop = container.scrollHeight - container.clientHeight;
      }
      if (xhttp.readyState === 4) {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      }
    };
    xhttp.open('GET', element.getAttribute('data-xhr'), true);
    xhttp.send();
  }
};

/**
 * Attach event to elements
 *
 * @param {DOMelement} element - to attach event
 * @param {string} event - type
 * @param {function} handler - event handler
 */
function attachEventHandler(element, event, handler) {
  if (element.attachEvent) {
    element.attachEvent('on' + event, handler);
  } else if (element.addEventListener) {
    element.addEventListener(event, handler, false);
  } else {
    element.addEventListener(event, handler, false);
  }
}

/**
 * attach event handlers
 */
Object.values(handlers).forEach((handler) => {
  handler.elements.forEach((element) => {
    attachEventHandler(element, handler.event, handler.func);
  });
});
