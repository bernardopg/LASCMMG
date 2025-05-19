describe('Smoke Test', () => {
  it('should load the home page', () => {
    cy.visit('/'); // Assumes baseUrl is set in cypress.config.js
    cy.contains('LASCMMG'); // Check for a common text on the home page, adjust as needed
  });

  it('should navigate to the login page', () => {
    cy.visit('/');
    // This depends on how navigation to login is implemented
    // For example, if there's a "Login" button/link:
    // cy.contains('Login').click();
    // Or directly visit:
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.contains('Login - LASCMMG'); // Check for text on the login page
  });

  // Add more basic navigation or critical path tests here
});
