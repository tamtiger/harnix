import { createRepoMap } from "src/core/repo-map/store.js";
import type { RepoMapQuerySignals, RepoMapV1 } from "src/core/repo-map/types.js";
import { fixtureRecord } from "test/support/repo-map-fixtures.js";

/** File names and declared names taken from the sessions this ranker was tuned against. */
const corpus: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["src/core/context/session-cache.ts", ["MAX_SESSION_SLOTS", "readSessionCache", "writeSessionCache"]],
  ["src/core/context/context.ts", ["buildContext"]],
  ["src/core/other/holder.ts", ["buildSessionCacheKey"]],
  ["src/core/workflow/text-integrity.ts", ["assertTextIntegrity", "detectMojibake"]],
  ["src/core/workflow/run-check.ts", ["resetBreaker", "runCheck"]],
  ["src/core/workflow/run-checks.ts", ["runChecks"]],
  ["src/core/workflow/epic-order.ts", ["readEpicOrder", "setEpicOrder"]],
  ["src/core/epics/epic.ts", ["readEpic"]],
  ["application/models/Feature/M17/M17C78Model.php", ["M17C78Model", "destroyWarehouseCode", "payServiceFee"]],
  ["application/models/App/AppLastKeyModel.php", ["AppLastKeyModel", "generateAutoKeyM01ReceiptCode"]],
  ["application/controllers/EMR/ServiceController.php", ["ServiceController"]],
  ["src/Transactions/Transaction.cs", ["PaymentRequestCode", "Transaction"]],
  ["src/Dtos/CreatePaymentRequestInput.cs", ["CreatePaymentRequestInput"]],
  ["src/Transactions/PaymentSplit.cs", ["PaymentSplit", "SplitCode"]],
  ["src/Views/SplitterView.cs", ["SplitterView"]],
  ["src/core/repo-map/graph.ts", ["buildRepoMapGraph"]],
  ["src/commands/repo-map-internal.ts", ["queryRepoMapInternal"]],
];

export function queryCorpus(): RepoMapV1 {
  return createRepoMap(
    corpus.map(([path, identifiers]) => fixtureRecord(path, { identifiers: [...identifiers].sort() })),
  );
}

/** The task a developer has active while asking about something else: its files are never the answer. */
export const activeTaskSignals: RepoMapQuerySignals = {
  relevantPaths: ["src/core/repo-map/graph.ts", "src/commands/repo-map-internal.ts"],
  taskTerms: ["repo", "map", "graph", "query"],
};

/** Query and the file that must be among the top three results. */
export const goldenQueries: ReadonlyArray<readonly [string, string]> = [
  ["session cache", "src/core/context/session-cache.ts"],
  ["text integrity mojibake", "src/core/workflow/text-integrity.ts"],
  ["run-check circuit breaker", "src/core/workflow/run-check.ts"],
  ["epic order", "src/core/workflow/epic-order.ts"],
  ["payServiceFee", "application/models/Feature/M17/M17C78Model.php"],
  ["generateAutoKeyM01ReceiptCode", "application/models/App/AppLastKeyModel.php"],
  ["PaymentRequestCode", "src/Transactions/Transaction.cs"],
  ["SplitCode", "src/Transactions/PaymentSplit.cs"],
  ["cache", "src/core/other/holder.ts"],
];
