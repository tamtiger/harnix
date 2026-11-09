import { describe, expect, it } from "vitest";

import { extractImports } from "src/core/repo-map/extract-imports.js";

describe("extractImports", () => {
  it("reads TypeScript, C# and project reference imports for non-PHP files", () => {
    const content =
      'import { a } from "./a.js";\nusing System.Text;\n<ProjectReference Include="..\\Core\\Core.csproj" />\n';

    expect(extractImports(content, "typescript")).toEqual(["../Core/Core.csproj", "./a.js", "System.Text"]);
  });

  it("reads PHP use statements with the namespace separator replaced by a dot", () => {
    expect(extractImports("use App\\Models\\Foo as Bar;\nuse \\Vendor\\Baz;\n", "php")).toEqual([
      "App.Models.Foo",
      "Vendor.Baz",
    ]);
  });

  it("skips use function and use const in PHP", () => {
    expect(extractImports("use function App\\helper;\nuse const App\\LIMIT;\n", "php")).toEqual([]);
  });

  it("reads PHP require and include with an optional constant prefix", () => {
    const content = "require_once APPPATH.'models/A.php';\ninclude('b.php');\nrequire __DIR__ . '/c.php';\n";

    expect(extractImports(content, "php")).toEqual(["b.php", "c.php", "models/A.php"]);
  });

  it("reads CodeIgniter loaders and maps a helper to its file name", () => {
    const content = "$this->load->model('M/Foo');\n$this->load->helper('m17');\n$this->load->view('pages/x');\n";

    expect(extractImports(content, "php")).toEqual(["M/Foo", "m17_helper", "pages/x"]);
  });

  it("ignores the SQL builder's from and join strings in PHP", () => {
    expect(extractImports("$this->db->from('orders o')->join('items i', 'i.id = o.id');\n", "php")).toEqual([]);
  });
});
