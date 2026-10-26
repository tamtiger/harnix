import { readFileSync } from "node:fs";
import { join } from "node:path";

const BUDGET_FILE = "scripts/footprint-budget.json";

export function readBudget(root, read = (path) => readFileSync(path, "utf8")) {
  let parsed;
  try {
    parsed = JSON.parse(read(join(root, "scripts", "footprint-budget.json")));
  } catch (error) {
    throw new Error(`${BUDGET_FILE} is missing or not valid JSON: ${error.message}`);
  }
  const maxBytes = parsed?.maxBytes;
  if (!Number.isInteger(maxBytes) || maxBytes <= 0)
    throw new Error(`${BUDGET_FILE} needs a positive integer "maxBytes".`);
  return maxBytes;
}

export function assertWithinBudget(bytes, maxBytes) {
  if (bytes > maxBytes)
    throw new Error(
      `Harnix generated footprint is ${bytes - maxBytes} bytes over the ${maxBytes}-byte budget in ${BUDGET_FILE}; ` +
        "shrink the generated output or raise maxBytes deliberately with a reason in the changelog.",
    );
}
