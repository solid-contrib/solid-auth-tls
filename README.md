# solid-auth-tls
[![](https://img.shields.io/badge/project-Solid-7C4DFF.svg?style=flat)](https://github.com/solid/solid)
[![NPM Version](https://img.shields.io/npm/v/solid-auth-tls.svg?style=flat)](https://npm.im/solid-auth-tls)
[![Build Status](https://travis-ci.org/solid/solid-auth-tls.svg?branch=master)](https://travis-ci.org/solid/solid-auth-tls)
[![Coverage Status](https://coveralls.io/repos/github/solid/solid-auth-tls/badge.svg?branch=master)](https://coveralls.io/github/solid/solid-auth-tls?branch=master)

JS client authentication library for [Solid](https://github.com/solid/solid)
browser-based clients. Used inside
[`solid-client`](https://github.com/solid/solid-client).

## Usage

The `solid-auth-tls` client can be used from Node as well as browser processes.

### Within Node

```js
const auth = require('solid-auth-tls')

auth.login({ key: 'path/to/tls-key.pem', cert: 'path/to/tls-cert.pem' })
  .then(webId => /* ... */)
  .catch(err => /* ... */)
```

### Within the Browser

A UMD bundle is provided so that you can do the following (after including the
bundle via an HTML `<script>` tag):

```js
SolidAuthTLS.login() // the browser automatically provides the client key/cert for you
  .then(webId => /* ... */)
  .catch(err => /* ... */)
```

You can also use a module bundler such as webpack and require the module like in
the node example.  When using webpack you need to include the following
plugin(s) in order to keep webpack from trying to resolve node modules such as
`fs` and `https`.  Add this to your `webpack.config.js`:

```js
const webpack = require('webpack')

module.exports = {
  // ...
  plugins: [
    new webpack.DefinePlugin({ 'global.IS_BROWSER': true })
    new webpack.optimize.UglifyJsPlugin(/* ... */)
  ]
}
```

This makes sure that code paths that require node modules (for use within node)
become dead code and get removed by the `UglifyJsPlugin`'s dead code eliminator.
