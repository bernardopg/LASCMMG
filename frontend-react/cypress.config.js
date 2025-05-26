const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173', // Assuming Vite dev server runs here
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false, // Or 'cypress/support/e2e.js' if you add custom commands
    video: false, // Disable video recording for now
    screenshotOnRunFailure: true,
    setupNodeEvents(/* on, config */) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false, // Or 'cypress/support/component.js'
  },
});
