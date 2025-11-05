export type Options = {
  charset?: string | string[]
  encoding?: BufferEncoding
}

/**
 * Ondergoed
 *
 * Transforms strings into randomized, variable-length character sequences using a custom charset.
 *
 * - Lowercase characters represent 0 bits
 * - Uppercase characters represent 1 bits
 *
 * The charset is split into two halves: even bytes and odd bytes.
 * Each byte is encoded using runs of identical bits into characters from its half.
 */
export class Ondergoed {
  charset: string[]
  charsA: string
  charsB: string
  lookupA: Map<string, number>
  lookupB: Map<string, number>

  /** Default lowercase alphabet charset */
  static CHARSET = Array.from({ length: 26 }, (_, key) => String.fromCharCode(key + 97))

  /**
   * Generates a randomized charset split into two halves.
   * Each half is used to encode even and odd bytes separately.
   */
  static defaultCharset() {
    const codes = [...Ondergoed.CHARSET]

    for (let i = codes.length - 1; i > 0; i--) {
      const position = Math.floor(Math.random() * (i + 1))
      const currentValue = codes[i]

      codes[i] = codes[position]
      codes[position] = currentValue
    }

    const center = Math.floor(codes.length / 2)

    return [codes.slice(0, center).join(''), codes.slice(center).join('')]
  }

  /**
   * Defines or validates the charset.
   *
   * Ensures that it contains alphabetic characters only,
   * is split correctly into two halves, and is unique.
   */
  static defineCharset(charset?: Options['charset']): Charset {
    if (!charset) {
      return Ondergoed.defaultCharset()
    }

    if (Array.isArray(charset) === false && typeof charset !== 'string') {
      return Ondergoed.defaultCharset()
    }

    const regex = /^[a-zA-Z]+$/
    let result: Charset | undefined
    let letters: string | undefined

    if (typeof charset === 'string' && charset.length > 2) {
      letters = charset.split('').reduce((chars, ch) => {
        const lower = ch.toLowerCase()
        return ch.match(regex) && !chars.includes(lower) ? chars + lower : chars
      }, '')

      // pad missing letters
      while (letters.length < 9) {
        for (const c of Ondergoed.CHARSET) {
          if (!letters.includes(c)) letters += c
          if (letters.length >= 9) break
        }
      }

      const stop = Math.floor(letters.length / 2)
      result = [letters.substring(0, stop), letters.substring(stop)]
    } else if (Array.isArray(charset)) {
      if (!charset[0]?.length || !charset[1]?.length) {
        return Ondergoed.defaultCharset()
      }
      result = [charset[0].toLowerCase(), charset[1].toLowerCase()]
    } else {
      return Ondergoed.defaultCharset()
    }

    const [zero, one] = result
    if (!zero.match(regex) || !one.match(regex)) {
      return Ondergoed.defaultCharset()
    }

    if (zero.split('').some((z) => one.includes(z))) {
      return Ondergoed.defaultCharset()
    }

    return result
  }

  constructor(options?: Options) {
    this.charset = Ondergoed.defineCharset(options?.charset)
    this.charsA = this.charset[0]
    this.charsB = this.charset[1]

    this.lookupA = new Map([...this.charsA].map((c, i) => [c, i]))
    this.lookupB = new Map([...this.charsB].map((c, i) => [c, i]))
  }

  /**
   * Encode a UTF-8 string into a randomized, variable-length encoded form.
   */
  encode(value?: string, encoding?: BufferEncoding) {
    if (!value || !value.length) return

    const bytes = Buffer.from(value, encoding || 'utf-8')
    const encoded: string[] = []

    const even = this.charsA
    const odd = this.charsB
    const lenEven = even.length
    const lenOdd = odd.length

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]
      const bits = byte.toString(2).padStart(8, '0') // preserve MSB→LSB order
      const position = i % 2
      const charset = position ? odd : even
      const charsetLen = position ? lenOdd : lenEven

      let runChar = bits[0]
      let runLength = 1

      for (let j = 1; j < 8; j++) {
        if (bits[j] === runChar) {
          runLength++
        } else {
          const idx = (runLength - 1) % charsetLen
          const ch = charset[idx]
          encoded.push(runChar === '0' ? ch : ch.toUpperCase())
          runChar = bits[j]
          runLength = 1
        }
      }

      // final run
      const idx = (runLength - 1) % charsetLen
      const ch = charset[idx]
      encoded.push(runChar === '0' ? ch : ch.toUpperCase())
    }

    return encoded.join('')
  }

  /**
   * Decode an encoded string back into its original format.
   * Uses precomputed lookup maps and accurate byte-parity tracking.
   */
  decode(value?: string, encoding?: BufferEncoding) {
    if (!value || !value.length) return

    const evenLookup = this.lookupA
    const oddLookup = this.lookupB

    const bits: string[] = []
    let bitCount = 0
    let byteIndex = 0

    for (let i = 0; i < value.length; i++) {
      const c = value[i]
      const lower = c.toLowerCase()
      const position = byteIndex % 2
      const lookup = position ? oddLookup : evenLookup
      const idx = lookup.get(lower) ?? 0
      const runLen = idx + 1
      const bit = c === lower ? '0' : '1'
      const segment = bit.repeat(runLen)
      bits.push(segment)
      bitCount += runLen

      while (bitCount >= 8) {
        bitCount -= 8
        byteIndex++
      }
    }

    const joined = bits.join('')
    const bytes: number[] = []

    for (let i = 0; i < joined.length; i += 8) {
      const chunk = joined.slice(i, i + 8)
      if (chunk.length < 8) break
      bytes.push(parseInt(chunk, 2))
    }

    return Buffer.from(bytes).toString(encoding || 'utf8')
  }
}
