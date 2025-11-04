import path, { extname } from 'node:path'
import { unlinkSync } from 'node:fs'

import esbuild from 'esbuild'

import { sync } from 'glob'
;(() => {
  const defaults = {
    bundle: true,
    entryPoints: [...sync(['./src/tests/*.test.ts'])],
    external: ['mocha'],
    minify: false,
    outdir: 'dist/tests',
    platform: 'node',
    outExtension: { '.js': '.cjs' }
  }

  esbuild.build(defaults)
})()
