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
 * Provides methods for WebID authentication and signup in Solid
 * @see {@link https://github.com/solid/}
 * @module solid-auth-tls
 */

const auth = require('./auth')

module.exports = {
  Signup: require('./signup'),
  login: auth.login,
  currentUser: auth.currentUser
}
