import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}", "tests/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.vitest },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      // Sin estas dos reglas el linter cree que los componentes
      // importados no se usan, porque solo aparecen dentro del JSX.
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      ...reactHooks.configs.recommended.rules,
      // Se apaga a proposito: guardar el resultado de una peticion en el
      // estado dentro de un useEffect es el patron de carga de datos que
      // usa el curso. La regla es experimental y aqui da falsos avisos.
      "react-hooks/set-state-in-effect": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
];
