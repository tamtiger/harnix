/**
 * Thin adapter: the hidden `workflow` transports live in `src/core/workflow/`. This module only
 * keeps the historical import path stable for the CLI wiring.
 */
export * from "src/core/workflow/index.js";
