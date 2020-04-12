/**
 * Returns whether the tour should be shown to the user after the
 * startup of the application.
 */
export function shouldOfferTourToUser = state => !state.tour.seen && !state.tour.isOpen;
