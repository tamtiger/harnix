import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { RepoMapRecordV1 } from "src/core/repo-map/types.js";

/** Writes `files` (repository-relative path to content) below `root`, creating parent directories. */
export async function writeFixtureFiles(root: string, files: Readonly<Record<string, string>>): Promise<void> {
  for (const [path, content] of Object.entries(files)) {
    const absolute = join(root, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, content);
  }
}

/** A CodeIgniter-style PHP application: SQL builder calls, `load->model`, `require_once`, namespaced `use`. */
export const codeIgniterFiles: Readonly<Record<string, string>> = {
  "application/models/M17/M17C78Model.php": String.raw`<?php
class M17C78Model extends CI_Model {
  public $warehouse_id;
  public function generateAutoKeyM01ReceiptCode($cashier) {
    return $this->db->from('m17_export_mst e')->join('m01_fee_dtl d', 'd.id = e.id')->get();
  }
  private function destroyWarehouseCode() {}
}
`,
  "application/controllers/M17/M17C55Controller.php": String.raw`<?php
use App\Models\Foo;
require_once APPPATH.'models/Helper.php';
class M17C55Controller extends CI_Controller {
  public function index() {
    $this->load->model('M17/M17C78Model');
    $this->load->helper('m17');
    $code = $this->M17C78Model->generateAutoKeyM01ReceiptCode(1);
  }
}
`,
  "application/helpers/m17_helper.php": "<?php\nfunction m17_format_code($value) { return $value; }\n",
};

/** An ABP-style .NET solution: an entity, an application service that uses it and two project files. */
export const abpFiles: Readonly<Record<string, string>> = {
  "frt-core/src/Core.Domain/Transactions/Transaction.cs": [
    "using Volo.Abp.Domain.Entities;",
    "namespace Core.Transactions;",
    "public class Transaction : Entity<Guid>",
    "{",
    "    public string PaymentRequestCode { get; set; }",
    "    public Dictionary<string, int> Counts { get; set; }",
    "    public Transaction() { }",
    "    public Task<Transaction> GetFooAsync(int id) { return null; }",
    "}",
    "",
  ].join("\n"),
  "frt-core/src/Core.Domain/Core.Domain.csproj": '<Project Sdk="Microsoft.NET.Sdk"></Project>\n',
  "frt-core/src/Core.Application/Core.Application.csproj":
    '<Project Sdk="Microsoft.NET.Sdk"><ItemGroup><ProjectReference Include="..\\Core.Domain\\Core.Domain.csproj" /></ItemGroup></Project>\n',
  "frt-core/src/Core.Application/PaymentRequestAppService.cs": [
    "using Core.Transactions;",
    "public class PaymentRequestAppService",
    "{",
    "    public void Run(Transaction transaction) { var code = transaction.PaymentRequestCode; }",
    "}",
    "",
  ].join("\n"),
};

/** A small TypeScript module graph: `api.ts` is imported by two components. */
export const typeScriptFiles: Readonly<Record<string, string>> = {
  "src/modules/api.ts": "export function fetchProviders() { return []; }\n",
  "src/modules/index.tsx":
    'import { fetchProviders } from "./api";\nexport function Index() { return fetchProviders(); }\n',
  "src/modules/list.tsx":
    'import { fetchProviders } from "./api";\nexport function List() { return fetchProviders(); }\n',
};

/** Builds a minimal valid record for tests that need a map without touching the filesystem. */
export function fixtureRecord(path: string, overrides: Partial<RepoMapRecordV1> = {}): RepoMapRecordV1 {
  return {
    byteLength: 10,
    contentHash: "a".repeat(64),
    extension: path.split(".").pop() ?? "",
    headings: [],
    identifiers: [],
    importTargets: [],
    kind: "source",
    packagePath: "",
    path,
    ...overrides,
  };
}
