import { basePage } from "./basePage"
import { visaNumber, visaExpiry, visaCvc } from "../../fixtures/cardData"
import { cardAddedToast } from "../../support/page-objects/toasts/cardAddedToast"
import { selectPlanModal } from "../../support/page-objects/modals/billing/selectPlanModal"
import { planDetailsModal } from "../../support/page-objects/modals/billing/planDetailsModal"
import { selectPaymentMethodModal } from "../../support/page-objects/modals/billing/selectPaymentMethodModal"
import { planChangeConfirmationModal } from "../../support/page-objects/modals/billing/planChangeConfirmationModal"
import { planChangeSuccessModal } from "../../support/page-objects/modals/billing/planChangeSuccessModal"

export const settingsPage = {
  ...basePage,

  // profile tab
  profileTabButton: () => cy.get("[data-testid=tab-profile]"),
  profileTabHeader: () => cy.get("[data-cy=label-profile-header]"),
  firstNameInput: () => cy.get("[data-cy=input-profile-firstname]"),
  lastNameInput: () => cy.get("[data-cy=input-profile-lastname]"),
  saveChangesButton: () => cy.get("[data-cy=button-save-changes]"),
  addUsernameButton: () => cy.get("[data-cy=button-add-username]"),
  usernameInput: () => cy.get("[data-cy=input-profile-username]"),
  usernameErrorLabel: () => cy.get("[data-cy=input-profile-username] span.error"),
  setUsernameButton: () => cy.get("[data-cy=button-set-username]"),
  usernamePresentInput: () => cy.get("[data-cy=input-profile-username-present]"),

  // security tab
  securityTabButton: () => cy.get("[data-testid=tab-security]"),
  securityTabHeader: () => cy.get("[data-cy=label-security-header]"),

  // subscription tab
  subscriptionTabButton: () => cy.get("[data-testid=tab-subscription]"),
  planNameLabel: () => cy.get("[data-cy=label-plan-name]"),
  addCardButton: () => cy.get("[data-testid=button-add-a-card]"),
  updateCardButton: () => cy.get("[data-testid=button-update-a-card]"),
  defaultCardLabel: () => cy.get("[data-cy=label-default-card]"),
  noCardLabel: () => cy.get("[data-cy=label-no-card]"),
  removeCardLink: () => cy.get("[data-cy=link-remove-card]"),
  changePlanButton: () => cy.get("[data-cy=button-change-plan]", { timeout: 10000 }),

  // use this convenience function when an upgraded account is required as a test requisite
  upgradeSubscription(plan: "standard" | "premium") {
    const planContainer = plan === "standard" ? "@standardPlanBox" : "@premiumPlanBox"

    this.subscriptionTabButton().click()
    this.changePlanButton().click()
    selectPlanModal.body().should("be.visible")
    selectPlanModal.createPlanCypressAliases()
    cy.get(planContainer).parent().within(() => {
      selectPlanModal.selectPlanButton().click()
    })
    planDetailsModal.selectThisPlanButton().click()
    selectPaymentMethodModal.body().should("be.visible")
    selectPaymentMethodModal.addCardTextButton()
      .should("be.visible")
      .click()
    cy.awaitStripeElementReady()
    selectPaymentMethodModal.cardNumberInput().type(visaNumber)
    selectPaymentMethodModal.expiryDateInput().type(visaExpiry)
    selectPaymentMethodModal.cvcNumberInput().type(visaCvc)
    selectPaymentMethodModal.useThisCardButton().click()
    cy.awaitStripeConfirmation()
    cy.awaitDefaultCardRequest()
    cardAddedToast.body().should("be.visible")
    cardAddedToast.closeButton().click()
    selectPaymentMethodModal.selectPaymentButton().click()
    planChangeConfirmationModal.confirmPlanChangeButton().click()
    planChangeSuccessModal.body().should("be.visible")
    planChangeSuccessModal.closeButton()
      .should("be.visible")
      .safeClick()
  }
}
