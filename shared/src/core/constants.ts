/** Simulation tuning constants shared by the systems. */

/** Upper bound on a single step to keep physics stable after a tab stall. */
export const MAX_STEP_SECONDS = 0.05;
/** Distance beyond the arena at which entities are removed. */
export const CULL_MARGIN = 100;
/** Mouse dead-zone padding beyond the player radius. */
export const MOUSE_DEAD_ZONE = 8;
/** Distance over which the mouse approach eases to full speed. */
export const MOUSE_EASE_DISTANCE = 80;
