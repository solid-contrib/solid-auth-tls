/* global XMLHttpRequest */

var defaultConfig = require('./config-default')

/**
 * Returns whether or not the current JS engine is in a browser environment. The
 * environment is assumed to be Node.js if this returns false. Heuristically
 * just looks for 'window' and 'XMLHttpRequest'.
 * @returns {Boolean} true if the environment is a browser, false otherwise
 */
function isBrowser () {
  return typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined'
}

/**
 * Enumerates the two main types of authentication endpoints.
 * @readonly
 * @enum {number}
 */
const AUTH_ENDPOINTS = {
  PRIMARY: 0,
  SECONDARY: 1
}

/**
 * "Logs in"* to a WebID-TLS server by sending a HEAD request.  The TLS
 * handshake happens implicitly through either an 'XMLHttpRequest' or node
 * 'https.request'.
 *
 * First tries to log in to the "primary" WebID-TLS endpoint, and retries with
 * the "fallback" endpoint if the first attempt fails.
 *
 * @param {Object} config - the configuration object specified in {@link
 * module:config-default}.
 * @returns {(Promise<String>|Promise<null>)} the WebID as a string if the
 * client cert is recognized, otherwise null.
 */
function login (config) {
  config = Object.assign({}, defaultConfig, config)
  return loginTo(AUTH_ENDPOINTS.PRIMARY, config)
    .then(webId => webId || loginTo(AUTH_ENDPOINTS.SECONDARY, config))
}

/**
 * Alias to {@link login}
 */
const currentUser = login

/**
 * Logs in to the specified endpoint with the given configuration
 * @param {AUTH_ENDPOINTS} endpoint - the endpoint type
 * @param {@link module:config-default} config - the config object
 * @returns {(Promise<String>|Promise<null>)} the WebID as a string if the
 * client cert is recognized, otherwise null.
 */
function loginTo (endpoint, config) {
  return isBrowser()
    ? loginFromBrowser(endpoint, config)
    : loginFromNode(endpoint, config)
}

/**
 * Logs in to the specified endpoint from within the browser
 * @param {AUTH_ENDPOINTS} endpoint - the endpoint type
 * @param {@link module:config-default} config - the config object
 * @returns {(Promise<String>|Promise<null>)} the WebID as a string if the
 * client cert is recognized, otherwise null.
 */
function loginFromBrowser (endpoint, config) {
  let uri

  switch (endpoint) {
    case AUTH_ENDPOINTS.PRIMARY:
      uri = config.authEndpoint || window.location.origin + window.location.pathname
      break
    case AUTH_ENDPOINTS.SECONDARY:
      uri = config.fallbackAuthEndpoint
      break
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.addEventListener('load', () => {
      resolve(xhr.getResponseHeader('user') || null)
    })
    xhr.addEventListener('error', err => {
      reject(err)
    })
    xhr.open('HEAD', uri)
    xhr.send()
  })
}

/**
 * Logs in to the specified endpoint from within a Node.js environment
 * @param {AUTH_ENDPOINTS} endpoint - the endpoint type
 * @param {@link module:config-default} config - the config object
 * @returns {(Promise<String>|Promise<null>)} the WebID as a string if the
 * client cert is recognized, otherwise null.
 */
function loginFromNode (endpoint, config) {
  if (!(config.key && config.cert)) {
    throw new Error('Must provide TLS key and cert when running in node')
  }

  let uri

  switch (endpoint) {
    case AUTH_ENDPOINTS.PRIMARY:
      uri = config.authEndpoint
      break
    case AUTH_ENDPOINTS.SECONDARY:
      uri = config.fallbackAuthEndpoint
      break
  }

  const fs = require('fs')
  const https = require('https')
  const url = require('url')

  return Promise.all([config.key, config.cert].map(filename =>
    new Promise((resolve, reject) => {
      fs.readFile(filename, (err, data) => err ? reject(err) : resolve(data))
    })
  )).then(([keyBuf, certBuf]) => {
    const parsedUrl = url.parse(uri)
    const options = {
      method: 'HEAD',
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      timeout: 5000,
      key: keyBuf,
      cert: certBuf
    }
    return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        resolve(res.headers['user'] || null)
      })
      req.on('error', reject)
      req.end()
    })
  })
}

module.exports = {
  currentUser,
  login
}
