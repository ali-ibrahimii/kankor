/** `deck_cards.interval` is a Postgres smallint — keep stored intervals below its max. */
export const MAX_STORED_INTERVAL_DAYS = 32_000;

/** In-session learning steps: how soon a card comes back after each grade. */
export const LEARNING_STEP_AGAIN_MINUTES = 1;
export const LEARNING_STEP_HARD_MINUTES = 10;
export const RELEARNING_STEP_MINUTES = 10;
