import esbuild from "esbuild";
import { parse } from "@toolbarthomas/argumentje";

/**
 * Compiles the required modules.
 */
(async () => {
  const { minify, format } = parse();
  const extension = format === "cjs" ? ".cjs" : format === "esm" ? "mjs" : "js";

  const defaults = {
    bundle: true,
    entryPoints: ["./src/index.ts"],
    external: [],
    minify,
    keepNames: true,
    metafile: false,
    outdir: "dist",
    format,
    platform: "node",
    outExtension: { ".js": minify ? `.min.${extension}` : `.${extension}` },
  };

  esbuild
    .build({ ...defaults, format: format === "cjs" ? "cjs" : "esm" })
    .then(() => {
      console.info(`Package compiled.`);
    });
})();
