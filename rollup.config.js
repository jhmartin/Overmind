"use strict";

// noinspection NpmUsedModulesInstalled
import clean from "rollup-plugin-clean";
// noinspection NpmUsedModulesInstalled
import resolve from "rollup-plugin-node-resolve";
// noinspection NpmUsedModulesInstalled
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
// noinspection NpmUsedModulesInstalled
import screeps from "rollup-plugin-screeps";

let cfg;
const i = process.argv.indexOf("--dest") + 1;
if (i === 0) {
    console.log("No destination specified - code will be compiled but not uploaded");
} else if (i >= process.argv.length || (cfg = require("./screeps")[process.argv[i]]) == null) {
    throw new Error("Invalid upload destination");
}

export default {
    input: "src/main.ts",
    output: {
        file: "dist/main.js",
        format: "cjs",
        sourcemap: false
    },
    onwarn: function (warning) {
        // Skip default export warnings from using obfuscated overmind file in main
        if (warning.toString().includes('commonjs-proxy')) {
            return;
        }
        // console.warn everything else
        console.warn(warning.message);
    },
    plugins: [
        clean(),
        resolve(),
        commonjs({
                     namedExports: {
                         'src/Overmind_obfuscated': ['_Overmind'],
                         'screeps-profiler': ['profiler'],
                         'columnify': ['columnify']
                     }
                 }),
        typescript({tsconfig: "./tsconfig.json"}),
        screeps({config: cfg, dryRun: cfg == null})
    ]
}