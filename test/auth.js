/* eslint-env mocha */

const fs = require('fs')

const chai = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

const auth = require('../src/auth')

chai.use(sinonChai)
const expect = chai.expect

const keyFilename = `${__dirname}/key.pem`
const certFilename = `${__dirname}/cert.pem`

const key = fs.readFileSync(keyFilename)
const cert = fs.readFileSync(certFilename)

describe('TLS Client Authentication', () => {
  describe('login', () => {
    describe('in a node environment', () => {
      it('detects the node environment and requires TLS client credentials', () => {
        const login = require('../src/auth').login
        expect(login).to.throw(Error, /Must provide TLS key and cert/)
      })

      it('rejects if the key or buffer cannot be found', () => {
        const requestStub = sinon.stub()
        const login = proxyquire('../src/auth', { https: { request: requestStub } }).login
        return login({ key: './path/does/not/exist', cert: certFilename })
          .catch(err => expect(err.code).to.equal('ENOENT'))
      })

      it('rejects on a request error', () => {
        const requestStub = sinon.stub()
          .returns({
            on: sinon.stub().callsArgWith(1, new Error('foo')),
            end: sinon.stub()
          })

        const login = proxyquire('../src/auth', { https: { request: requestStub } }).login

        return login({ key: keyFilename, cert: certFilename })
          .catch(err => expect(err.message).to.equal('foo'))
      })

      it('uses the client credentials in the TLS handshake', () => {
        const requestStub = sinon.stub()
          .callsArgWith(1, { headers: { user: 'https://example.com/people#me' } })
          .returns({
            on: sinon.stub(),
            end: sinon.stub()
          })

        const login = proxyquire('../src/auth', { https: { request: requestStub } }).login

        return login({ authEndpoint: 'https://localhost:8443/', key: keyFilename, cert: certFilename })
          .then(() => {
            expect(requestStub).to.have.been.calledOnce
            expect(requestStub).to.have.been.calledWithMatch({
              method: 'HEAD',
              key: key,
              cert: cert
            })
          })
      })

      it("resolves to the user's Web ID when they are logged in", () => {
        const webId = 'https://example.com/people#me'
        const requestStub = sinon.stub()
          .callsArgWith(1, { headers: { user: webId } })
          .returns({
            on: sinon.stub(),
            end: sinon.stub()
          })

        const login = proxyquire('../src/auth', { https: { request: requestStub } }).login

        return login({ key: keyFilename, cert: certFilename })
          .then(w => {
            expect(w).to.equal(webId)
          })
      })

      it('tries the fallback endpoint when the user is not recognized at the primary endpoint', () => {
        const webId = 'https://example.com/people#me'
        const requestStub = sinon.stub()
          .onFirstCall()
          .callsArgWith(1, { headers: {} })
          .returns({
            on: sinon.stub(),
            end: sinon.stub()
          })
          .onSecondCall()
          .callsArgWith(1, { headers: { user: 'https://example.com/people#me' } })
          .returns({
            on: sinon.stub(),
            end: sinon.stub()
          })

        const login = proxyquire('../src/auth', { https: { request: requestStub } }).login

        return login({ key: keyFilename, cert: certFilename })
          .then(user => {
            expect(requestStub).to.have.been.calledTwice
            expect(user).to.equal(webId)
          })
      })

      it('resolves to null if the user is not logged in at the primary or fallback endpoint', () => {
        const requestStub = sinon.stub()
          .onFirstCall()
          .callsArgWith(1, { headers: {} })
          .returns({
            on: sinon.stub(),
            end: sinon.stub()
          })
          .onSecondCall()
          .callsArgWith(1, { headers: {} })
          .returns({
            on: sinon.stub(),
            end: sinon.stub()
          })

        const login = proxyquire('../src/auth', { https: { request: requestStub } }).login

        return login({ key: keyFilename, cert: certFilename })
          .then(user => {
            expect(requestStub).to.have.been.calledTwice
            expect(user).to.be.null
          })
      })

      it('respects the hostname, port, and path when sending the request', () => {
        const requestStub = sinon.stub()
          .callsArgWith(1, { headers: {} })
          .returns({
            on: sinon.stub(),
            end: sinon.stub()
          })

        const login = proxyquire('../src/auth', { https: { request: requestStub } }).login

        return login({ authEndpoint: 'https://localhost:8443/', key: keyFilename, cert: certFilename })
          .then(() => {
            expect(requestStub).to.have.been.calledWithMatch({
              hostname: 'localhost',
              port: '8443',
              path: '/'
            })
          })
      })
    })
  })

  describe('currentUser', () => {
    it('is just the login function', () => {
      expect(auth.currentUser).to.equal(auth.login)
    })
  })
})
