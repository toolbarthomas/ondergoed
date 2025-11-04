import { Charset, Options } from './types'

/**
 * Ondergoed Transforms strings into randomized, variable-length character
 * sequences using a custom charset.
 *
 * Each byte of the input is encoded using one of two charset halves,
 * allowing for flexible, obfuscated text output.
 *
 * Lowercase characters represent 0 bits, uppercase represent 1 bits.
 */
export class Ondergoed {
  charset: Charset

  /**
   * Default character set: lowercase a-z.
   */
  static CHARSET = Array.from({ length: 26 }, (_, key) => key + 97).map((v) =>
    String.fromCharCode(v)
  )

  /**
   * Generates a default randomized charset split into two halves.
   * Each half is used to encode even and odd bytes separately,
   * allowing for variable-length encoding.
   */
  static defaultCharset() {
    let defaultCharacterCodes = [...Ondergoed.CHARSET]

    for (let i = defaultCharacterCodes.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1))
      const commit = defaultCharacterCodes[i]

      defaultCharacterCodes[i] = defaultCharacterCodes[randomIndex]
      defaultCharacterCodes[randomIndex] = commit
    }

    const stop = Math.floor(defaultCharacterCodes.length / 2)
    const charset = ['', '']

    let i = 0

    while (i < defaultCharacterCodes.length) {
      charset[i < stop ? 0 : 1] += defaultCharacterCodes[i]
      i++
    }

    return charset
  }

  /**
   * Defines the character set used by the encoder/decoder.
   *
   * The charset determines the characters used to represent 0s and 1s:
   * - Lowercase characters represent 0 bits
   * - Uppercase characters represent 1 bits
   *
   * The charset is split into two halves to encode even and odd bytes separately:
   *
   * Example:
   * [evenCharset, oddCharset] = ["abcd", "efgh"]
   * Byte 0,2,4 -> uses "abcd" for encoding
   * Byte 1,3,5 -> uses "efgh" for encoding
   *
   * @param charset Optional user-defined charset (string or array of strings)
   */
  static defineCharset(charset?: Options['charset']) {
    // Use the result if the defined charset does not match the Array schema.
    let result

    if (!charset) {
      return Ondergoed.defaultCharset()
    }

    // Use the default charset if the charset property is not a string or array.
    if (Array.isArray(charset) === false && typeof charset !== 'string') {
      return Ondergoed.defaultCharset()
    }

    const regex = new RegExp(/^[a-zA-Z]+$/)

    // Only accept charsets that contains characters from the alphabet.
    // Store the defined letters so the character casing can be skipped.
    let letters
    if (typeof charset === 'string' && charset.length > 2) {
      letters = charset
        .split('')
        .reduce(
          (characters, character) =>
            character && character.match(regex) && characters.indexOf(character.toLowerCase()) < 0
              ? (characters += character.toLowerCase())
              : characters,
          ''
        )

      let prefixBy = 9 - letters.length
      if (prefixBy > 0) {
        while (prefixBy) {
          let i = 0

          while (i < Ondergoed.CHARSET.length) {
            if (letters.indexOf(Ondergoed.CHARSET[i]) < 0) {
              letters += Ondergoed.CHARSET[i]
            }

            i++
          }

          prefixBy--
        }
      }

      const stop = Math.floor(letters.length / 2)

      result = [letters.substring(0, stop), letters.substring(stop)]
    } else {
      return Ondergoed.defaultCharset()
    }

    // Ensure the defined chartset is at least 2 characters.
    if (Array.isArray(charset) && charset.length < 2) {
      return Ondergoed.defaultCharset()
    }

    // Ensure array defined charset has any values.
    if (!charset[0].length || !charset[1].length) {
      return Ondergoed.defaultCharset()
    }

    // Ensure the used charset is in lowercase by default.
    if (!result) {
      result = [charset[0].toLowerCase(), charset[1].toLowerCase()]
    }

    // Check if the defined charset array only contains characters from the
    // alphabet.
    if (!result[0].match(regex) || !result[1].match(regex)) {
      return Ondergoed.defaultCharset()
    }

    const [zero, one] = result

    if (!zero || !one || !zero.length || !one.length) {
      return Ondergoed.defaultCharset()
    }

    // Ensure the custom chartset only contains unique characters.
    if (!letters && zero.split('').filter((z) => one.split('').includes(z)).length) {
      return Ondergoed.defaultCharset()
    }

    return result
  }

  constructor(options?: Options) {
    this.charset = Ondergoed.defineCharset(options?.charset)
  }

  /**
   * Decodes a string previously encoded with this encoder.
   *
   * @param value The encoded string
   */
  decode(value?: string) {
    if (!value || !value.length) {
      return
    }

    let i = 0

    const decoded: string[] = []

    while (i < value.length) {
      const c = value[i].toLowerCase()
      const position = this.charset[0].includes(c) ? 0 : 1
      const multiplier = this.charset[position].indexOf(c) + 1
      const previousCharacter = value[i - 1]

      let bit = new Array<string>(multiplier)

      let ii = 0

      while (ii < multiplier) {
        bit[ii] = this.charset[position].includes(value[i]) ? '0' : '1'

        ii++
      }

      const padding = bit.join('')

      if (!decoded[decoded.length - 1]) {
        decoded.push(padding)
      }

      if (
        previousCharacter &&
        this.charset[position].includes(previousCharacter.toLowerCase()) &&
        this.charset[position].includes(c)
      ) {
        decoded[decoded.length - 1] = decoded[decoded.length - 1] + padding
      } else if (previousCharacter) {
        decoded.push(padding)
      }

      i++
    }

    if (!decoded.length) {
      return
    }

    i = 0

    while (i < decoded.length) {
      decoded[i] = String.fromCharCode(parseInt(decoded[i], 2))
      i++
    }

    return decoded.join('')
  }

  /**
   * Encodes a string into a variable-length, randomized character representation.
   *
   * @param value The string to encode
   */
  encode(value?: string) {
    if (!value || !value.length) {
      return
    }

    const size = value.length

    const bytes = new Array<string>(value.length)

    let i = 0

    while (i < bytes.length) {
      bytes[i] = value.charCodeAt(i).toString(2).padStart(8, '0')

      i++
    }

    if (!bytes.length) {
      return
    }

    i = 0

    let encoded = []

    if (!bytes || !bytes.length) {
      return
    }

    while (i < bytes.length) {
      const collection = bytes[i].match(/(.)\1{0,}/g) || []
      const position = i % 2

      if (!collection.length) {
        break
      }

      let ii = 0

      while (ii < collection.length) {
        const bit = collection[ii].length - 1

        const character = this.charset[position][bit]
          ? this.charset[position][bit]
          : this.charset[position][0]

        encoded.push(collection[ii][0] === '0' ? character : character.toUpperCase())

        ii++
      }

      i++
    }

    return encoded.join('')
  }
}
