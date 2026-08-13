// Configuracion del linter. Se mantiene simple: reglas
// recomendadas mas unas pocas que ayudan a evitar errores.
const js = require("@eslint/js");

module.exports = [
  { ignores: ["node_modules", "subidas"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        fetch: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_|^next$" }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
  {
    // Los archivos de prueba usan modulos ES (import) porque asi los lee Vitest
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        require: "readonly",
        console: "readonly",
        Buffer: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
];
