import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Las pruebas comparten una sola base de datos, asi que se
    // ejecutan de a un archivo para que no se pisen entre si.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
