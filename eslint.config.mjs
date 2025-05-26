import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      // bring in all Node.js built-in globals (require, module, process…)
      globals: globals.node
    },
    rules: {
      // disable the unused-vars rule project-wide
      "no-unused-vars": "off"
    }
  }
]);
