// Only add things here that could be applicable to all / most pages

export const basePage = {
  appHeaderLabel: () => cy.get("[data-cy=label-files-app-header]", { timeout: 20000 }),
  searchInput: () => cy.get("[data-testid=input-search-bar]"),
  signOutDropdown: () => cy.get("[data-testid=dropdown-title-sign-out-dropdown]"),
  signOutMenuOption: () => cy.get("[data-cy=menu-sign-out]"),
  // Mobile view only element
  hamburgerMenuButton: () => cy.get("[data-testid=icon-hamburger-menu]"),

  // helpers and convenience functions
  awaitBucketRefresh() {
    cy.intercept("POST", "**/bucket/*/ls").as("refresh")
    cy.wait("@refresh")
  }
}
