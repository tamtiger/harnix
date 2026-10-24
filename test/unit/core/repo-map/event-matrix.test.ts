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
    expect(() => validateRepoMapOptions({ events: true, workspace: ["a", "b"] })).not.toThrow();
    expect(() => validateRepoMapOptions({ events: true, workspace: "a,b" })).not.toThrow();
    expect(() => validateRepoMapOptions({ events: true, query: "search" })).toThrow(
      /requires (?:at most|exactly) one of/iu,
    );
    expect(() => validateRepoMapOptions({ events: true, refresh: true })).toThrow(
      /requires (?:at most|exactly) one of/iu,
    );
  });

  it("excludes test files from event matrix to eliminate mock calls (ac-3)", async () => {
    const root = await temporaryRepository();
    await writeSource(
      root,
      "src/PaymentService.cs",
      `
public class PaymentService {
    public async Task Pay() {
        await _producer.PublishAsync("payment.success", new {});
    }
}
`,
    );
    await writeSource(
      root,
      "test/PaymentServiceTests.cs",
      `
public class PaymentServiceTests {
    public void Test() {
        _producer.PublishAsync("mock.topic.test", new {});
    }
}
`,
    );

    const result = await buildProjectEventMatrix(root);
    const topics = result.matrix.map((m) => m.topic);
    expect(topics).toContain("payment.success");
    expect(topics).not.toContain("mock.topic.test");
  });

  it("resolves constant topic identifiers to string values in event matrix (ac-5)", async () => {
    const root = await temporaryRepository();
    await writeSource(
      root,
      "src/Common/KafkaTopics.cs",
      `
public static class KafkaTopics {
    public const string WebhookFinished = "paymenthub.webhook.finished";
    public const string DiscountSaved = "paymenthub.transactionstore.discount.saved";
}
`,
    );
    await writeSource(
      root,
      "src/Consumers/WebhookConsumer.cs",
      `
public class WebhookConsumer {
    [CapSubscribe(KafkaTopics.WebhookFinished)]
    public void OnWebhook() {}

    public async Task Process() {
        await _bus.PublishAsync(KafkaTopics.DiscountSaved, new {});
    }
}
`,
    );

    const result = await buildProjectEventMatrix(root);
    const topics = result.matrix.map((m) => m.topic);
    expect(topics).toContain("paymenthub.webhook.finished");
    expect(topics).toContain("paymenthub.transactionstore.discount.saved");
    expect(topics).not.toContain("KafkaTopics.WebhookFinished");
    expect(topics).not.toContain("KafkaTopics.DiscountSaved");
  });

  it("extracts constants and default property initializers from *Options.cs class (ac-1)", async () => {
    const root = await temporaryRepository();
    await writeSource(
      root,
      "src/Options/KafkaOptions.cs",
      `
public class KafkaOptions {
    public string OrderCreatedTopic { get; set; } = "order.created.from.options";
    public string PaymentRefundTopic { get; init; } = "payment.refund.from.options";
}
`,
    );
    await writeSource(
      root,
      "src/Services/OrderService.cs",
      `
public class OrderService {
    public async Task CreateOrder() {
        await _bus.PublishAsync(_options.Value.OrderCreatedTopic, new {});
    }
}
`,
    );

    const result = await buildProjectEventMatrix(root);
    const topics = result.matrix.map((m) => m.topic);
    expect(topics).toContain("order.created.from.options");
    expect(topics).not.toContain("_options.Value.OrderCreatedTopic");
  });

  it("recognizes producer wrappers configured in .harnix/config.yaml in event matrix (ac-2)", async () => {
    const root = await temporaryRepository();
    await writeSource(
      root,
      ".harnix/config.yaml",
      `
generator: harnix
schemaVersion: 2
developer: test-dev
languages: []
technologies: []
packages: []
platforms: []
context:
  maxCharacters: 1000
  tokenApproximation: 4
runtime:
  research: conditional
  fullContext: false
events:
  producerWrappers:
    - PublishCustomAsync
    - DispatchKafka
`,
    );
    await writeSource(
      root,
      "src/Services/PaymentService.cs",
      `
public class PaymentService {
    public async Task Process() {
        await PublishCustomAsync("payment.custom.success", new {});
        await DispatchKafka("kafka.dispatched.event", payload);
    }
}
`,
    );

    const result = await buildProjectEventMatrix(root);
    const topics = result.matrix.map((m) => m.topic);
    expect(topics).toContain("payment.custom.success");
    expect(topics).toContain("kafka.dispatched.event");
    const paymentTopic = result.matrix.find((m) => m.topic === "payment.custom.success");
    expect(paymentTopic?.publishers).toEqual([
      expect.objectContaining({
        file: "src/Services/PaymentService.cs",
        source: "PublishCustomAsync",
      }),
    ]);
  });

  it("builds unified cross-system E2E event matrix from multiple workspace roots (ac-1 & ac-3)", async () => {
    const rootA = await temporaryRepository();
    const rootB = await temporaryRepository();

    await writeSource(
      rootA,
      "src/ProducerService.cs",
      `
public class ProducerService {
    public async Task Send() {
        await _bus.PublishAsync("order.e2e.created", new { Id = 100 });
    }
}
`,
    );

    await writeSource(
      rootB,
      "src/ConsumerService.cs",
      `
public class ConsumerService {
    [CapSubscribe("order.e2e.created")]
    public void ReceiveOrder() {}
}
`,
    );

    const { buildMultiWorkspaceEventMatrix } = await import("src/core/repo-map/event-matrix.js");
    const result = await buildMultiWorkspaceEventMatrix([rootA, rootB]);

    expect(result.scope).toBe("workspace");
    expect(result.status).toBe("ready");
    const entry = result.matrix.find((m) => m.topic === "order.e2e.created");
    expect(entry).toBeDefined();
    expect(entry?.publishers.length).toBe(1);
    expect(entry?.subscribers.length).toBe(1);
  });

  it("automatically scans and merges linkedWorkspaces configured in .harnix/config.yaml (ac-2)", async () => {
    const rootA = await temporaryRepository();
    const rootB = await temporaryRepository();

    await writeSource(
      rootB,
      "src/ShippingConsumer.cs",
      `
public class ShippingConsumer {
    [CapSubscribe("payment.e2e.completed")]
    public void HandleShipping() {}
}
`,
    );

    await writeSource(
      rootA,
      ".harnix/config.yaml",
      `
generator: harnix
schemaVersion: 2
developer: test-dev
languages: []
technologies: []
packages: []
platforms: []
context:
  maxCharacters: 1000
  tokenApproximation: 4
runtime:
  research: conditional
  fullContext: false
linkedWorkspaces:
  - "${rootB.replaceAll("\\", "/")}"
`,
    );

    await writeSource(
      rootA,
      "src/PaymentProducer.cs",
      `
public class PaymentProducer {
    public async Task Pay() {
        await _bus.PublishAsync("payment.e2e.completed", new {});
    }
}
`,
    );

    const result = await buildProjectEventMatrix(rootA);
    const entry = result.matrix.find((m) => m.topic === "payment.e2e.completed");
    expect(entry).toBeDefined();
    expect(entry?.publishers.length).toBe(1);
    expect(entry?.subscribers.length).toBe(1);
  });
});
