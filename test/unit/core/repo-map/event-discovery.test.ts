import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { discoverEvents, extractRouteAndTopicIdentifiers } from "src/core/repo-map/event-discovery.js";
import { extractRepoMapRecord } from "src/core/repo-map/extract.js";
import { extractFileSymbols } from "src/core/repo-map/outline.js";
import type { RepoMapInventoryFile } from "src/core/repo-map/types.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-event-discovery-");

describe("event and route discovery", () => {
  it("extracts C# HTTP route attributes and Express/Fastify routes (ac-1)", () => {
    const csharpCode = `
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase {
    [HttpGet]
    public IActionResult GetAll() => Ok();

    [HttpGet("{id}"), Authorize]
    public IActionResult GetById(int id) => Ok();

    [Authorize, HttpPost("checkout")]
    public IActionResult Checkout() => Ok();

    [HttpDelete("{id}")]
    public IActionResult Cancel(int id) => Ok();
}
`;
    const csEvents = discoverEvents(csharpCode);
    expect(csEvents.routes.length).toBe(5);
    expect(csEvents.routes).toEqual([
      { line: 5, path: "api/[controller]" },
      { line: 7, method: "GET", path: "" },
      { line: 10, method: "GET", path: "{id}" },
      { line: 13, method: "POST", path: "checkout" },
      { line: 16, method: "DELETE", path: "{id}" },
    ]);

    const jsCode = `
import express from 'express';
const app = express();
const router = express.Router();

app.get('/health', (req, res) => res.send('ok'));
router.post('/api/v1/payments', async (req, res) => {});
fastify.put('/users/:id', async (req, reply) => {});
`;
    const jsEvents = discoverEvents(jsCode);
    expect(jsEvents.routes).toEqual([
      { line: 6, method: "GET", path: "/health" },
      { line: 7, method: "POST", path: "/api/v1/payments" },
      { line: 8, method: "PUT", path: "/users/:id" },
    ]);
  });

  it("extracts messaging topics from CAP, Topic attributes, and publish/subscribe calls (ac-2)", () => {
    const csharpCode = `
using DotNetCore.CAP;

public class OrderConsumer : ICapSubscribe {
    [CapSubscribe("order.created"), NonAction]
    public async Task HandleOrderCreated(OrderCreatedEvent msg) {}

    [Topic("payment.completed")]
    public void HandlePayment(PaymentCompletedEvent msg) {}

    public async Task ProduceEvent() {
        await _capBus.PublishAsync("order.shipped", new { Id = 1 });
    }
}
`;
    const csEvents = discoverEvents(csharpCode);
    expect(csEvents.topics).toEqual([
      { line: 5, role: "subscriber", source: '[CapSubscribe("order.created")]', topic: "order.created" },
      { line: 8, role: "subscriber", source: '[Topic("payment.completed")]', topic: "payment.completed" },
      { line: 12, role: "publisher", source: "publish", topic: "order.shipped" },
    ]);

    const jsCode = `
consumer.subscribe({ topic: "inventory.updated" });
bus.subscribe("email.send", async (data) => {});
await producer.send({ topic: "invoice.generated", messages: [] });
await capBus.publish("warehouse.allocated", "string payload");
`;
    const jsEvents = discoverEvents(jsCode);
    expect(jsEvents.topics).toEqual([
      { line: 2, role: "subscriber", source: "subscribe", topic: "inventory.updated" },
      { line: 3, role: "subscriber", source: "subscribe", topic: "email.send" },
      { line: 4, role: "publisher", source: "publish", topic: "invoice.generated" },
      { line: 5, role: "publisher", source: "publish", topic: "warehouse.allocated" },
    ]);
  });

  it("includes routes and topic names into record.identifiers for search indexing", async () => {
    const root = await temporaryRepository();
    const filePath = "services/OrderService/Controllers/OrderController.cs";
    const absolutePath = join(root, filePath);
    await mkdir(join(absolutePath, ".."), { recursive: true });
    const content = `
[Route("api/orders")]
public class OrderController {
    [CapSubscribe("order.created")]
    public void HandleOrder() {
        _capBus.Publish("billing.charge", new {});
    }
}
`;
    await writeFile(absolutePath, content, "utf8");
    const invFile: RepoMapInventoryFile = {
      absolutePath,
      byteLength: Buffer.byteLength(content),
      path: filePath,
    };

    const record = await extractRepoMapRecord(invFile, ["services/OrderService"]);
    expect(record).toBeDefined();
    expect(record?.identifiers).toContain("api/orders");
    expect(record?.identifiers).toContain("order.created");
    expect(record?.identifiers).toContain("billing.charge");
    expect(record?.identifiers).toContain("CapSubscribe");
    expect(record?.identifiers).toContain("Route");
  });

  it("preserves attributes in method signatures in repo-map outline", () => {
    const csCode = `
public class OrderController {
    [HttpGet("api/orders")]
    public async Task<IActionResult> GetOrders() {
        return Ok();
    }

    [CapSubscribe("order.placed")]
    public void Consume(OrderPlacedEvent ev) {
    }
}
`;
    const symbols = extractFileSymbols(csCode, "cs");
    const getMethod = symbols.find((s) => s.name === "GetOrders");
    expect(getMethod).toBeDefined();
    expect(getMethod?.signature).toContain('[HttpGet("api/orders")]');

    const consumeMethod = symbols.find((s) => s.name === "Consume");
    expect(consumeMethod).toBeDefined();
    expect(consumeMethod?.signature).toContain('[CapSubscribe("order.placed")]');
  });

  it("extracts route and topic identifiers for search indexing", () => {
    const csCode = `
[Route("api/orders")]
public class OrderController {
    [CapSubscribe("order.placed")]
    public void Handle() {}
}
`;
    const tokens = extractRouteAndTopicIdentifiers(csCode);
    expect(tokens).toContain("api/orders");
    expect(tokens).toContain("order.placed");
    expect(tokens).toContain("CapSubscribe");
    expect(tokens).toContain("Route");
  });
});
