export const addOrUpdateCardModal = {
  body: () => cy.get("[data-testid=modal-container-add-or-update-card]", { timeout: 10000 }),
  addCardButton: () => cy.get("[data-testid=button-add-card]", { timeout: 10000 }),
  cancelButton: () => cy.get("[data-cy=button-cancel-add-card]"),
  cardErrorLabel: () => cy.get("[data-cy=label-add-card-error]"),
  cardNumberInput: () => cy.getWithinIframe("[data-elements-stable-field-name=cardNumber]", "#iframe-card-number iframe"),
  cvcNumberInput: () => cy.getWithinIframe("[data-elements-stable-field-name=cardCvc]", "#iframe-card-cvc iframe"),
  expiryDateInput: () => cy.getWithinIframe("[data-elements-stable-field-name=cardExpiry]", "#iframe-card-expiry iframe"),
  addCardHeader: () => cy.get("[data-cy=header-add-card]"),
  updateCardHeader: () => cy.get("[data-cy=header-update-card]"),
  updateCardButton: () => cy.get("[data-testid=button-update-card]", { timeout: 10000 })
}
