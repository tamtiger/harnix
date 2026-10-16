import { compareCodeUnits } from "src/utils/order.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export interface DiscoveredRoute {
  readonly method?: HttpMethod | undefined;
  readonly path: string;
  readonly line: number;
}

export interface DiscoveredTopic {
  readonly topic: string;
  readonly role: "publisher" | "subscriber";
  readonly source: string;
  readonly line: number;
}

export interface DiscoveredEvents {
  readonly routes: readonly DiscoveredRoute[];
  readonly topics: readonly DiscoveredTopic[];
}

const secretValue = /(?:api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,]{8,}/iu;

export function discoverEvents(content: string): DiscoveredEvents {
  const lines = content.replaceAll("\r\n", "\n").split("\n");
  const routes: DiscoveredRoute[] = [];
  const topics: DiscoveredTopic[] = [];

  for (let idx = 0; idx < lines.length; idx += 1) {
    const raw = lines[idx] ?? "";
    const trimmed = raw.trim();
    if (
      trimmed.length === 0 ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("#") ||
      secretValue.test(trimmed)
    ) {
      continue;
    }
    const lineNumber = idx + 1;
    extractRoutes(trimmed, lineNumber, routes);
    extractSubscriberTopics(trimmed, lineNumber, topics);
    extractPublisherTopics(trimmed, lineNumber, topics);
  }

  return { routes, topics };
}

function extractRoutes(trimmed: string, lineNumber: number, routes: DiscoveredRoute[]): void {
  const csharpHttpAttrRe =
    /(?:\[|,\s*)(HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch|HttpHead|HttpOptions|Route)(?:\s*\(\s*["']([^"']+)["']\s*\))?(?=\s*(?:,|\]))/gu;
  for (const match of trimmed.matchAll(csharpHttpAttrRe)) {
    const attr = match[1]!;
    const pathArg = match[2]?.trim();
    const method = attr === "Route" ? undefined : (attr.replace(/^Http/u, "").toUpperCase() as HttpMethod);
    if (pathArg !== undefined || method !== undefined) {
      routes.push({
        line: lineNumber,
        path: pathArg ?? "",
        ...(method ? { method } : {}),
      });
    }
  }

  const expressRouteRe =
    /\b(?:app|router|fastify|server)\.(get|post|put|delete|patch|head|options)\s*\(\s*["'`]([^"'`]+)["'`]/gu;
  for (const match of trimmed.matchAll(expressRouteRe)) {
    routes.push({
      line: lineNumber,
      method: match[1]!.toUpperCase() as HttpMethod,
      path: match[2]!.trim(),
    });
  }
}

function extractSubscriberTopics(trimmed: string, lineNumber: number, topics: DiscoveredTopic[]): void {
  const csharpSubscriberAttrRe =
    /(?:\[|,\s*)(CapSubscribe|Topic|KafkaListener|RabbitListener|Queue)\s*\(\s*["']([^"']+)["']\s*(?:,[^\]]+)?\)(?=\s*(?:,|\]))/gu;
  for (const match of trimmed.matchAll(csharpSubscriberAttrRe)) {
    const attr = match[1]!;
    const topic = match[2]!.trim();
    if (topic && !secretValue.test(topic)) {
      topics.push({
        line: lineNumber,
        role: "subscriber",
        source: `[${attr}("${topic}")]`,
        topic,
      });
    }
  }

  const jsSubscriberObjectRe =
    /\b(?:consumer|bus|channel|client|subscriber)\.(?:subscribe|consume)\s*\(\s*\{\s*topic\s*:\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(jsSubscriberObjectRe)) {
    const topic = match[1]!.trim();
    if (topic && !secretValue.test(topic) && !topics.some((t) => t.line === lineNumber && t.topic === topic)) {
      topics.push({
        line: lineNumber,
        role: "subscriber",
        source: "subscribe",
        topic,
      });
    }
  }

  const jsSubscriberDirectRe =
    /\b(?:(?:consumer|bus|channel|client|subscriber)\.)?(?:subscribe|consume)\s*\(\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(jsSubscriberDirectRe)) {
    const topic = match[1]!.trim();
    if (topic && !secretValue.test(topic) && !topics.some((t) => t.line === lineNumber && t.topic === topic)) {
      topics.push({
        line: lineNumber,
        role: "subscriber",
        source: "subscribe",
        topic,
      });
    }
  }

  const csharpSubscriberCallRe = /\b(?:Subscribe|Consume)\s*\(\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(csharpSubscriberCallRe)) {
    const topic = match[1]!.trim();
    if (topic && !secretValue.test(topic) && !topics.some((t) => t.line === lineNumber && t.topic === topic)) {
      topics.push({
        line: lineNumber,
        role: "subscriber",
        source: "Subscribe",
        topic,
      });
    }
  }
}

function extractPublisherTopics(trimmed: string, lineNumber: number, topics: DiscoveredTopic[]): void {
  const publisherObjectRe =
    /\b(?:_?capBus|_?bus|_?publisher|_?producer|_?eventBus|kafka|channel|client)\.(?:Publish|PublishAsync|produce|Produce|ProduceAsync|send|publish|emit)\s*\(\s*\{\s*topic\s*:\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(publisherObjectRe)) {
    const topic = match[1]!.trim();
    if (topic && !secretValue.test(topic)) {
      topics.push({
        line: lineNumber,
        role: "publisher",
        source: "publish",
        topic,
      });
    }
  }

  const publisherDirectRe =
    /\b(?:_?capBus|_?bus|_?publisher|_?producer|_?eventBus|kafka|channel|client)\.(?:Publish|PublishAsync|produce|Produce|ProduceAsync|send|publish|emit|sendToQueue)\s*\(\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(publisherDirectRe)) {
    const topic = match[1]!.trim();
    if (topic && !secretValue.test(topic) && !topics.some((t) => t.line === lineNumber && t.topic === topic)) {
      topics.push({
        line: lineNumber,
        role: "publisher",
        source: "publish",
        topic,
      });
    }
  }

  const standalonePublishRe = /\b(?:Publish|PublishAsync|Produce|ProduceAsync)\s*\(\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(standalonePublishRe)) {
    const topic = match[1]!.trim();
    if (topic && !secretValue.test(topic) && !topics.some((t) => t.line === lineNumber && t.topic === topic)) {
      topics.push({
        line: lineNumber,
        role: "publisher",
        source: "Publish",
        topic,
      });
    }
  }
}

export function extractRouteAndTopicIdentifiers(content: string): string[] {
  const events = discoverEvents(content);
  const result: string[] = [];
  for (const r of events.routes) {
    if (r.path.length > 0) result.push(r.path);
  }
  for (const t of events.topics) {
    result.push(t.topic);
  }
  const attrMatches = content.matchAll(
    /\[(HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch|Route|CapSubscribe|Topic)\b/gu,
  );
  for (const match of attrMatches) {
    result.push(match[1]!);
  }
  return [...new Set(result)].sort(compareCodeUnits);
}
