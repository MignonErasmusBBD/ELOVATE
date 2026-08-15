export const ACCOUNT_CHANGED_EVENT = "elovate-account-changed";

export function notifyAccountChanged() {
  window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
}
