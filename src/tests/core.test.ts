import { Ondergoed } from '../index'

import assert, { equal } from 'assert'
import { describe, it } from 'mocha'

describe('Default Encode decode', () => {
  const codec = new Ondergoed()

  const mock = 'Hello World'
  const encoded = codec.encode(mock)
  const decoded = codec.decode(encoded)

  it('Is encoded', () => assert.notEqual(encoded, mock))
  it('Is String', () => assert.equal(typeof encoded, 'string'))
  it('Match type', () => assert.equal(typeof encoded, typeof mock))
  it('Match from encoded', () => assert.equal(decoded, mock))
})

describe('Custom Encode decode', () => {
  const codec = new Ondergoed({ charset: 'Lorem Ipsum Si Dolor Amet' })

  const mock = 'Hello World'
  const token = 'lLoLrpSsPpPlOlOopSpSslOlEsPalLlLlRpSpDlRoLlpSpSslOoLo'
  const encoded = codec.encode(mock)
  const decoded = codec.decode(encoded)

  it('Is encoded', () => assert.notEqual(encoded, mock))
  it('Is String', () => assert.equal(typeof encoded, 'string'))
  it('Match type', () => assert.equal(typeof encoded, typeof mock))
  it('Match from encoded', () => assert.equal(decoded, mock))
  it('Fixed result', () => assert.equal(encoded, token))
})
