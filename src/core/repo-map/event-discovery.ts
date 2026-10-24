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

const EXCLUDED_DYNAMIC_IDENTIFIERS = new Set([
  "createdEto",
  "refundEto",
  "payload",
  "data",
  "topic",
  "message",
  "event",
  "obj",
  "object",
  "new",
  "stoppingToken",
  "cancellationToken",
  "token",
  "default",
  "null",
  "this",
  "splitTopics",
  "dataKafka",
  "checkResult",
  "ObjectMapper",
]);

function isExcludedTopic(topic: string): boolean {
  if (EXCLUDED_DYNAMIC_IDENTIFIERS.has(topic)) return true;
  if (/^(?:Arg|It|Mock)\.(?:Any|IsAny|Is|Of)\b/u.test(topic)) return true;
  if (topic.includes("(") || topic.includes(")") || topic.includes("<") || topic.includes(">")) return true;
  if (/^(?:eto|checkResult|ObjectMapper|splitTopics)\b/iu.test(topic)) return true;
  if (/\.(?:EventName|CancelEto|Map)\b/iu.test(topic)) return true;
  if (
    /^[a-z][a-zA-Z0-9_]*$/u.test(topic) &&
    (topic.endsWith("Token") || topic.endsWith("Eto") || topic.endsWith("Payload"))
  ) {
    return true;
  }
  return false;
}

export function discoverEvents(content: string, producerWrappers: readonly string[] = []): DiscoveredEvents {
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
    extractPublisherTopics(trimmed, lineNumber, topics, producerWrappers);
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

function recordSubscriberTopic(
  topics: DiscoveredTopic[],
  lineNumber: number,
  topic: string | undefined,
  source: string,
): void {
  const clean = topic?.trim();
  if (
    clean &&
    !secretValue.test(clean) &&
    !isExcludedTopic(clean) &&
    !topics.some((t) => t.line === lineNumber && t.topic === clean)
  ) {
    topics.push({
      line: lineNumber,
      role: "subscriber",
      source,
      topic: clean,
    });
  }
}

function recordPublisherTopic(
  topics: DiscoveredTopic[],
  lineNumber: number,
  topic: string | undefined,
  source: string,
): void {
  const clean = topic?.trim();
  if (
    clean &&
    !secretValue.test(clean) &&
    !isExcludedTopic(clean) &&
    !topics.some((t) => t.line === lineNumber && t.topic === clean)
  ) {
    topics.push({
      line: lineNumber,
      role: "publisher",
      source,
      topic: clean,
    });
  }
}

function extractCSharpSubscriberTopics(trimmed: string, lineNumber: number, topics: DiscoveredTopic[]): void {
  const csharpSubscriberAttrRe =
    /(?:\[|,\s*)(CapSubscribe|Topic|KafkaListener|RabbitListener|Queue)\s*\(\s*(?:["']([^"']+)["']|([A-Za-z0-9_.]+))\s*(?:,[^\]]+)?\)(?=\s*(?:,|\]))/gu;
  for (const match of trimmed.matchAll(csharpSubscriberAttrRe)) {
    const attr = match[1]!;
    const topic = match[2] ?? match[3];
    const source = `[${attr}(${match[2] ? `"${topic}"` : topic})]`;
    recordSubscriberTopic(topics, lineNumber, topic, source);
  }

  const csharpSubscriberCallRe = /\b(?:Subscribe)\s*\(\s*(?:["']([^"']+)["']|([A-Za-z0-9_.]+))/gu;
  for (const match of trimmed.matchAll(csharpSubscriberCallRe)) {
    recordSubscriberTopic(topics, lineNumber, match[1] ?? match[2], "Subscribe");
  }
}

function extractSubscriberTopics(trimmed: string, lineNumber: number, topics: DiscoveredTopic[]): void {
  extractCSharpSubscriberTopics(trimmed, lineNumber, topics);

  const jsSubscriberObjectRe =
    /\b(?:consumer|bus|channel|client|subscriber)\.(?:subscribe|consume)\s*\(\s*\{\s*topic\s*:\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(jsSubscriberObjectRe)) {
    recordSubscriberTopic(topics, lineNumber, match[1], "subscribe");
  }

  const jsSubscriberDirectRe =
    /\b(?:(?:consumer|bus|channel|client|subscriber)\.)?(?:subscribe|consume)\s*\(\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(jsSubscriberDirectRe)) {
    recordSubscriberTopic(topics, lineNumber, match[1], "subscribe");
  }
}

function extractPublisherTopics(
  trimmed: string,
  lineNumber: number,
  topics: DiscoveredTopic[],
  producerWrappers: readonly string[] = [],
): void {
  const publisherObjectRe =
    /\b(?:_?capBus|_?bus|_?publisher|_?producer|_?eventBus|kafka|channel|client|[\w$]*(?:Producer|Publisher|Bus|EventBus))\.(?:Publish|PublishAsync|produce|Produce|ProduceAsync|send|publish|emit)\s*\(\s*\{\s*topic\s*:\s*["']([^"']+)["']/gu;
  for (const match of trimmed.matchAll(publisherObjectRe)) {
    recordPublisherTopic(topics, lineNumber, match[1], "publish");
  }

  const publisherDirectRe =
    /\b(?:_?capBus|_?bus|_?publisher|_?producer|_?eventBus|kafka|channel|client|[\w$]*(?:Producer|Publisher|Bus|EventBus))\.(?:Publish|PublishAsync|produce|Produce|ProduceAsync|send|publish|emit|sendToQueue)\s*\(\s*(?:["']([^"']+)["']|([A-Za-z0-9_.]+))/gu;
  for (const match of trimmed.matchAll(publisherDirectRe)) {
    recordPublisherTopic(topics, lineNumber, match[1] ?? match[2], "publish");
  }

  const standalonePublishRe =
    /\b(?:Publish|PublishAsync|Produce|ProduceAsync)\s*\(\s*(?:["']([^"']+)["']|([A-Za-z0-9_.]+))/gu;
  for (const match of trimmed.matchAll(standalonePublishRe)) {
    recordPublisherTopic(topics, lineNumber, match[1] ?? match[2], "Publish");
  }

  for (const wrapper of producerWrappers) {
    const escaped = wrapper.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    const wrapperRe = new RegExp(`\\b${escaped}\\s*\\(\\s*(?:["']([^"']+)["']|([A-Za-z0-9_.]+))`, "gu");
    for (const match of trimmed.matchAll(wrapperRe)) {
      recordPublisherTopic(topics, lineNumber, match[1] ?? match[2], wrapper);
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
