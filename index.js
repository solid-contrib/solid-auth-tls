/*
 The MIT License (MIT)

 Copyright (c) 2015-2016 Solid

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 solid-client is a Javascript library for Solid applications. This library
 currently depends on rdflib.js. Please make sure to load the rdflib.js script
 before loading solid-client

 If you would like to know more about the solid Solid project, please see
 https://github.com/solid/
 */
'use strict'
/**
 * Provides Solid methods for WebID authentication and signup
 * @module auth
 */
module.exports = ClientAuthTLS

var defaultConfig = require('./config-default')

function ClientAuthTLS (webClient, config) {
  this.webClient = webClient
  this.config = config || defaultConfig
}

/**
 * Returns the WebID of the current user (by doing a login()/HEAD request to
 * the current page). Convenience method, useful for standalone apps that aren't
 * wrapping any resource.
 * @method currentUser
 * @return {String} WebID of the current user or `null` if none detected
 */
ClientAuthTLS.prototype.currentUser = function currentUser () {
  if (typeof window === 'undefined') {
    return null  // only works in the browser
  }
  var currentPageUrl = window.location.href
  return this.login(currentPageUrl)
    .catch(function (reason) {
      console.log('Detecting current user failed: %o', reason)
      return null
    })
}

/**
 * Sets up an event listener to monitor login messages from child window/iframe
 * @method listen
 * @return {Promise<String>} Event listener promise, resolves to user's WebID
 */
ClientAuthTLS.prototype.listen = function listen () {
  var promise = new Promise(function (resolve, reject) {
    var eventMethod = window.addEventListener
      ? 'addEventListener'
      : 'attachEvent'
    var eventListener = window[eventMethod]
    var messageEvent = eventMethod === 'attachEvent'
      ? 'onmessage'
      : 'message'
    eventListener(messageEvent, function (e) {
      var u = e.data
      if (u.slice(0, 5) === 'User:') {
        var user = u.slice(5, u.length)
        if (user && user.length > 0 && user.slice(0, 4) === 'http') {
          return resolve(user)
        } else {
          return reject(user)
        }
      }
    }, true)
  })
  return promise
}

/**
 * Performs a Solid login() via an XHR HEAD operation.
 * (Attempts to find the current user's WebID from the User header, if
 *   already authenticated.)
 * @method login
 * @static
 * @param [url] {String} Location of a Solid server or container at which the
 *   user might be authenticated.
 *   Defaults to: current page location
 * @param [alternateAuthUrl] {String} URL of an alternate/default auth endpoint.
 *   Defaults to `config.authEndpoint`
 * @return {Promise<String>} XHR HEAD operation promise, resolves to user's WebID
 */
ClientAuthTLS.prototype.login = function login (url, alternateAuthUrl) {
  var defaultAuthEndpoint = this.config.authEndpoint
  url = url || window.location.origin + window.location.pathname
  alternateAuthUrl = alternateAuthUrl || defaultAuthEndpoint
  var webClient = this.webClient
  // First, see if user is already logged in (do a quick HEAD request)
  return webClient.head(url)
    .then(function (solidResponse) {
      if (solidResponse.isLoggedIn()) {
        return solidResponse.user
      } else {
        // If not logged in, try logging in at an alternate endpoint
        return webClient.head(alternateAuthUrl)
          .then(function (solidResponse) {
            // Will return an empty string is this login also fails
            return solidResponse.user
          })
      }
    })
}

/**
 * Opens a signup popup window, sets up `listen()`.
 * @method signup
 * @static
 * @param signupUrl {String} Location of a Solid server for user signup.
 * @return {Promise<String>} Returns a listener promise, resolves with signed
 *   up user's WebID.
 */
ClientAuthTLS.prototype.signup = function signup (signupUrl) {
  signupUrl = signupUrl || this.config.signupEndpoint
  var width = this.config.signupWindowWidth
  var height = this.config.signupWindowHeight
  // set borders
  var leftPosition = (window.screen.width / 2) - ((width / 2) + 10)
  // set title and status bars
  var topPosition = (window.screen.height / 2) - ((height / 2) + 50)
  var windowTitle = 'Solid signup'
  var windowUrl = signupUrl + '?origin=' +
    encodeURIComponent(window.location.origin)
  var windowSpecs = 'resizable,scrollbars,status,width=' + width + ',height=' +
    height + ',left=' + leftPosition + ',top=' + topPosition
  window.open(windowUrl, windowTitle, windowSpecs)
  var self = this
  return new Promise(function (resolve) {
    self.listen()
      .then(function (webid) {
        return resolve(webid)
      })
  })
}
