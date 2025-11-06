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

  /**
   * Fixed byte range that should not change.
   */
  static RANGE = 8

  /**
   * Default lowercase alphabet charset.
   */
  static CHARSET = Array.from({ length: 26 }, (_, key) => String.fromCharCode(key + 97))

  /**
   * Decode an encoded string back into its original format.
   * Uses precomputed lookup maps and accurate byte-parity tracking.
   */
  decode(value?: string, encoding?: BufferEncoding) {
    if (!value || !value.length) {
      return
    }

    const lookupA = this.lookupA
    const lookupB = this.lookupB

    const bits: string[] = []
    let currentBit = 0
    let currentByte = 0

    for (let i = 0; i < value.length; i++) {
      const c = value[i]
      const lower = c.toLowerCase()
      const position = currentByte % 2
      const lookup = position ? lookupB : lookupA
      const ii = lookup.get(lower) ?? 0
      const count = ii + 1
      const bit = c === lower ? '0' : '1'
      const segment = bit.repeat(count)

      bits.push(segment)
      currentBit += count

      while (currentBit >= Ondergoed.RANGE) {
        currentBit -= Ondergoed.RANGE
        currentByte++
      }
    }

    const joined = bits.join('')
    const bytes: number[] = []

    for (let i = 0; i < joined.length; i += Ondergoed.RANGE) {
      const chunk = joined.slice(i, i + Ondergoed.RANGE)
      if (chunk.length < Ondergoed.RANGE) break
      bytes.push(parseInt(chunk, 2))
    }

    return Buffer.from(bytes).toString(encoding || 'utf8')
  }

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
  static defineCharset(charset?: Options['charset']) {
    if (!charset) {
      return Ondergoed.defaultCharset()
    }

    if (Array.isArray(charset) === false && typeof charset !== 'string') {
      return Ondergoed.defaultCharset()
    }

    const regex = /^[a-zA-Z]+$/

    let result: string[] | undefined
    let letters: string | undefined

    if (typeof charset === 'string' && charset.length > 2) {
      letters = charset.split('').reduce((chars, ch) => {
        const lower = ch.toLowerCase()

        return ch.match(regex) && !chars.includes(lower) ? chars + lower : chars
      }, '')

      while (letters.length < 9) {
        for (const c of Ondergoed.CHARSET) {
          if (!letters.includes(c)) {
            letters += c
          }

          if (letters.length >= 9) {
            break
          }
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

    const [a, b] = result

    if (!a.match(regex) || !b.match(regex)) {
      return Ondergoed.defaultCharset()
    }

    if (a.split('').some((c) => b.includes(c))) {
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
    if (!value || !value.length) {
      return
    }

    const bytes = Buffer.from(value, encoding || 'utf-8')
    const encoded: string[] = []

    const a = this.charsA
    const b = this.charsB
    const sizeA = a.length
    const sizeB = b.length

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]
      const bits = byte.toString(2).padStart(Ondergoed.RANGE, '0')

      const position = i % 2
      const charset = position ? b : a
      const characterCount = position ? sizeB : sizeA

      let currentCharacter = bits[0]
      let count = 1

      for (let j = 1; j < Ondergoed.RANGE; j++) {
        if (bits[j] === currentCharacter) {
          count++
        } else {
          const ii = (count - 1) % characterCount
          const ch = charset[ii]

          encoded.push(currentCharacter === '0' ? ch : ch.toUpperCase())
          currentCharacter = bits[j]
          count = 1
        }
      }

      const address = (count - 1) % characterCount
      const result = charset[address]

      encoded.push(currentCharacter === '0' ? result : result.toUpperCase())
    }

    return encoded.join('')
  }
}
