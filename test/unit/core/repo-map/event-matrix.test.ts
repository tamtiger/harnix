import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildProjectEventMatrix, buildWorkspaceEventMatrix } from "src/core/repo-map/event-matrix.js";
import { validateRepoMapOptions } from "src/cli-helpers.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-event-matrix-");

async function writeSource(root: string, relPath: string, content: string): Promise<string> {
  const full = join(root, relPath);
  await mkdir(join(full, ".."), { recursive: true });
  await writeFile(full, content, "utf8");
  return full;
}

describe("cross-service event matrix (ac-1 & ac-2)", () => {
  it("builds topic matrix with publishers and subscribers within a project (ac-1)", async () => {
    const root = await temporaryRepository();
    await writeSource(
      root,
      "src/Controllers/OrderController.cs",
      `
[Route("api/orders")]
public class OrderController {
    [HttpPost]
    public async Task CreateOrder() {
        await _capBus.PublishAsync("order.created", new { Id = 1 });
    }
}
`,
    );
    await writeSource(
      root,
      "src/Consumers/OrderConsumer.cs",
      `
public class OrderConsumer {
    [CapSubscribe("order.created")]
    public void HandleOrder() {
    }

    [CapSubscribe("payment.received")]
    public void HandlePayment() {
    }
}
`,
    );

    const result = await buildProjectEventMatrix(root);
    expect(result.scope).toBe("project");
    expect(result.status).toBe("ready");
    expect(result.totalTopics).toBe(2);
    expect(result.matrix.map((m) => m.topic)).toEqual(["order.created", "payment.received"]);

    const orderCreated = result.matrix.find((m) => m.topic === "order.created");
    expect(orderCreated).toBeDefined();
    expect(orderCreated?.publishers).toEqual([
      {
        file: "src/Controllers/OrderController.cs",
        line: 6,
        package: "",
        source: "publish",
      },
    ]);
    expect(orderCreated?.subscribers).toEqual([
      {
        file: "src/Consumers/OrderConsumer.cs",
        line: 3,
        package: "",
        source: '[CapSubscribe("order.created")]',
      },
    ]);

    const paymentReceived = result.matrix.find((m) => m.topic === "payment.received");
    expect(paymentReceived?.publishers).toEqual([]);
    expect(paymentReceived?.subscribers.length).toBe(1);
  });

  it("builds cross-service event matrix spanning multiple microservices in a workspace (ac-2)", async () => {
    const root = await temporaryRepository();

    // Service 1: OrderService
    await writeSource(root, "services/OrderService/package.json", JSON.stringify({ name: "order-service" }));
    await writeSource(
      root,
      "services/OrderService/src/index.ts",
      `
import express from 'express';
app.post('/orders', async (req, res) => {
    await producer.send({ topic: "order.created", messages: [] });
});
`,
    );

    // Service 2: BillingService
    await writeSource(root, "services/BillingService/Billing.csproj", "<Project />");
    await writeSource(
      root,
      "services/BillingService/Consumers/OrderCreatedConsumer.cs",
      `
public class OrderCreatedConsumer {
    [CapSubscribe("order.created")]
    public async Task Handle(OrderCreated msg) {
        await _capBus.PublishAsync("payment.completed", new { Status = "Paid" });
    }
}
`,
    );

    // Service 3: NotificationService
    await writeSource(
      root,
      "services/NotificationService/package.json",
      JSON.stringify({ name: "notification-service" }),
    );
    await writeSource(
      root,
      "services/NotificationService/worker.js",
      `
consumer.subscribe({ topic: "order.created" });
consumer.subscribe({ topic: "payment.completed" });
`,
    );

    const result = await buildWorkspaceEventMatrix(root);
    expect(result.scope).toBe("workspace");
    expect(result.status).toBe("ready");
    expect(result.members).toEqual([
      "services/BillingService",
      "services/NotificationService",
      "services/OrderService",
    ]);
    expect(result.totalTopics).toBe(2);

    const orderCreated = result.matrix.find((m) => m.topic === "order.created");
    expect(orderCreated).toBeDefined();
    // Publisher from OrderService
    expect(orderCreated?.publishers).toEqual([
      {
        file: "services/OrderService/src/index.ts",
        line: 4,
        package: "services/OrderService",
        source: "publish",
      },
    ]);
    // Subscribers from BillingService and NotificationService
    expect(orderCreated?.subscribers).toEqual([
      {
        file: "services/BillingService/Consumers/OrderCreatedConsumer.cs",
        line: 3,
        package: "services/BillingService",
        source: '[CapSubscribe("order.created")]',
      },
      {
        file: "services/NotificationService/worker.js",
        line: 2,
        package: "services/NotificationService",
        source: "subscribe",
      },
    ]);

    const paymentCompleted = result.matrix.find((m) => m.topic === "payment.completed");
    expect(paymentCompleted?.publishers).toEqual([
      {
        file: "services/BillingService/Consumers/OrderCreatedConsumer.cs",
        line: 5,
        package: "services/BillingService",
        source: "publish",
      },
    ]);
    expect(paymentCompleted?.subscribers).toEqual([
      {
        file: "services/NotificationService/worker.js",
        line: 3,
        package: "services/NotificationService",
        source: "subscribe",
      },
    ]);
  });

  it("validates CLI options for --events and rejects mutually exclusive flags", () => {
    expect(() => validateRepoMapOptions({ events: true })).not.toThrow();
    expect(() => validateRepoMapOptions({ events: true, workspace: true })).not.toThrow();
    expect(() => validateRepoMapOptions({ events: true, query: "search" })).toThrow(/requires exactly one of/iu);
    expect(() => validateRepoMapOptions({ events: true, refresh: true })).toThrow(/requires exactly one of/iu);
  });
});
