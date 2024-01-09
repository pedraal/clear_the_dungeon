export default {
  root: 'src/',
  publicDir: '../static/',
  base: './',
  server: {
    port: 3000,
  },
  build:
    {
      outDir: '../dist', // Output in the dist/ folder
      emptyOutDir: true, // Empty the folder first
      sourcemap: true, // Add sourcemap
    },
}
