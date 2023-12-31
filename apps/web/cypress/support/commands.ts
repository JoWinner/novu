// load the global Cypress types
/// <reference types="cypress" />

Cypress.Commands.add('getByTestId', (selector, ...args) => {
  return cy.get(`[data-test-id=${selector}]`, ...args);
});

Cypress.Commands.add('getBySelectorLike', (selector, ...args) => {
  return cy.get(`[data-test*=${selector}]`, ...args);
});

Cypress.Commands.add('clickWorkflowNode', (selector: string, last?: boolean) => {
  if (last) {
    return cy.getByTestId(selector).last().click({ force: true });
  }

  return cy.getByTestId(selector).click({ force: true });
});

Cypress.Commands.add(
  'initializeSession',
  (settings: { disableLocalStorage?: boolean } = { disableLocalStorage: false }) => {
    return cy.task('getSession', settings).then((response: any) => {
      if (!settings.disableLocalStorage) {
        window.localStorage.setItem('auth_token', response.token);
      }

      return response;
    });
  }
);

Cypress.Commands.add('logout', (settings = {}) => {
  return window.localStorage.removeItem('auth_token');
});

Cypress.Commands.add('seedDatabase', () => {
  return cy.task('seedDatabase');
});

Cypress.Commands.add('clearDatabase', () => {
  return cy.task('clearDatabase');
});

export {};
