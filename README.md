# Ondergoed – Variable Text Encoder

Ondergoed is a simple character-based encoder that transforms strings into randomized, variable-length text sequences. Each byte is encoded using one of two halves of a charset, making the output obfuscated and flexible.

### Features

- Randomized charset generation
- Split encoding for even/odd bytes
- Encode/decode using a limited or custom charset

## Usage

```js
// Create an encoder instance (optional custom charset)
const encoder = new Ondergoed({
  charset: undefined // Use default charset or provide one or multiple strings
});

// Encode a string
const encoded = encoder.encode("Hello World");
console.log(encoded);

// Example output: rRaRduFfUuUrArAauFuFfrArSfUnrRrRrDuFuWrDaRruFuFfrAaRa

// Decode the string back
const decoded = encoder.decode(encoded);

console.log(decoded); // Hello World
```