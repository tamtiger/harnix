import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

/** A tiny in-memory order API: the smallest real target the harnix-exercise procedure can start, probe and stop. */
export interface RunningApi {
  readonly baseUrl: string;
  stop(): Promise<void>;
}

export async function startOrderApi(): Promise<RunningApi> {
  const orders = new Map<string, { id: string; item: string }>([["1", { id: "1", item: "book" }]]);
  const server: Server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const send = (status: number, body: unknown): void => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    };
    if (url.pathname === "/health") return send(200, { status: "ok" });
    const match = /^\/orders\/([^/]+)$/u.exec(url.pathname);
    if (request.method === "GET" && match !== null) {
      const order = orders.get(match[1]!);
      return order === undefined ? send(404, { error: "not-found" }) : send(200, order);
    }
    return send(400, { error: "bad-request" });
  });
  // Port 0: the operating system picks a free port, so the run never assumes a fixed one.
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error === undefined ? resolve() : reject(error)));
        server.closeAllConnections();
      }),
  };
}

/** Source of a tiny CLI: greets a name, refuses a missing one with a message on stderr and exit code 2. */
export const GREETER_CLI_SOURCE = `const name = process.argv[2];
if (name === undefined) {
  process.stderr.write("usage: greeter <name>\\n");
  process.exit(2);
}
process.stdout.write("hello " + name + "\\n");
`;
