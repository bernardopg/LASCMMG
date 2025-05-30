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

  it('should navigate to the admin dashboard page', () => {
    // This test might require mocking authentication or setting a token in a real scenario.
    // For a smoke test, we'll just try to visit and check for an element.
    // If not authenticated, it should redirect to /login or show an error.
    // For now, let's assume direct navigation for structure check.
    cy.visit('/admin');
    // Check for a common element on the admin dashboard
    // If it redirects to login, this check might fail or need adjustment.
    cy.contains('Painel Administrativo');
  });

  it('should show an error message for invalid login credentials', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('invalidpassword');
    cy.get('button[type="submit"]').click();
    // Assuming error messages are displayed within a specific container or have a certain class
    // Adjust the selector based on how error messages are rendered in Login.jsx
    // For example, if MessageContext renders messages in a div with class 'message-error'
    cy.contains('Falha na autenticação. Verifique suas credenciais.', {
      timeout: 5000,
    }); // Wait for potential API call
  });

  // Add more basic navigation or critical path tests here
});
