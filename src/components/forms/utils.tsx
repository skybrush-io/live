/**
 * Forces the submission of the form that is in the DOM with the given
 * identifier.
 *
 * @param formId  ID of the form in the DOM
 */
export function forceFormSubmission(formId: string) {
  const form = document.querySelector(`#${formId}`);
  if (form) {
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
  }
}
