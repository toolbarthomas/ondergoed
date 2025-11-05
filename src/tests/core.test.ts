import { Ondergoed } from '../index'

import assert, { equal } from 'assert'
import { randomBytes } from 'node:crypto'
import { describe, it } from 'mocha'

describe('Default encode/decode', () => {
  const codec = new Ondergoed()

  const mock = 'Hello World'
  const encoded = codec.encode(mock)
  const decoded = codec.decode(encoded)

  it('Is encoded', () => assert.notEqual(encoded, mock))
  it('Is String', () => assert.equal(typeof encoded, 'string'))
  it('Match type', () => assert.equal(typeof encoded, typeof mock))
  it('Match from encoded', () => assert.equal(decoded, mock))
})

describe('Custom encode/decode', () => {
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

describe('Custom encode/decode', () => {
  const codec = new Ondergoed({ charset: 'Lorem Ipsum Si Dolor Amet' })

  const mock = '😄'
  const encoded = codec.encode(mock)
  const decoded = codec.decode(encoded)

  it('Is encoded', () => assert.notEqual(encoded, mock))
  it('Is String', () => assert.equal(typeof encoded, 'string'))
  it('Match type', () => assert.equal(typeof encoded, typeof mock))
  it('Match from encoded', () => assert.equal(decoded, mock))
})

describe('Benchmark', () => {
  const codec = new Ondergoed()

  const iterations = 0x1000
  const size = 0x200
  let i = 0

  const currentTime = performance.now()

  while (i < iterations) {
    const mock = randomBytes(size).toString('hex')
    const encoded = codec.encode(mock)
    const decoded = codec.decode(encoded)

    assert.equal(decoded, mock)

    i++
  }

  const delta = performance.now() - currentTime

  console.log(
    `Completed: ${iterations} iterations in ${delta}ms [${iterations * size} characters processed]`
  )
})
