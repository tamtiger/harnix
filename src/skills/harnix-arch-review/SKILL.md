---
name: harnix-arch-review
description: Use when reviewing enterprise system architecture, evaluating WBS estimations, performing three-way requirement gap analysis or separating Backend Core from BFF layers.
metadata:
  version: "2.21.0"
---

# Architecture design review

Domain-agnostic enterprise architecture review for multi-channel systems, gap analysis, and effort consolidation.

## Evidence and Rationale

Evidence source: `research/external-research.md` (§A enterprise architecture decomposition, industry benchmark briefs, and three-way gap analysis patterns).
Enterprise initiatives often suffer from misaligned requirements, duplicate backend effort across channels, and missing industry regulatory baselines. Structured gap analysis and layered BFF separation eliminate redundant development while guaranteeing regulatory compliance.

## When to use

- Reviewing a WBS (Work Breakdown Structure) against customer requirements and industry best practice.
- Performing 3-way gap analysis: Missing, Over-scope, or Mis-organized features.
- Designing or validating an 8-layer multi-channel enterprise architecture.
- Consolidating backend effort into shared Core services plus channel-specific BFFs (Backend-For-Frontend).
- Evaluating domain models across banking, healthcare, pharma, e-commerce, logistics, or IoT.

## Architecture review procedure

1. **Detect & research domain**:
   - Inspect customer identity, vocabulary, and channel names to establish domain context.
   - Reference `domain-briefs` for actors, regulatory regimes, core modules, and integration benchmarks.
   - Detail: `harnix skill harnix-arch-review --reference domain-briefs`.

2. **WBS structural extraction**:
   - Scan channel sheets dynamically for the `Backend` effort column; forward-fill Level-1 and Level-2 feature hierarchies.
   - Reconcile line-item sums against sheet stats rows to verify column alignment.

3. **3-way gap analysis**:
   - Compare on two axes: against customer requirements AND against industry-standard baselines.
   - Classify findings into: **Missing** (mandatory requirements or regulatory baselines omitted), **Over-scope** (unrequested non-standard features), and **Misaligned** (structural mismatches).

4. **8-layer system overview**:
   - Structure components across standard layers: Actors, Front-end Channels, Edge, API Gateway, BFF, Core Domain Services, Data/Event & Governance, and External Integrations.
   - Enforce **One BFF per Channel**: each channel owns a dedicated lightweight BFF for schema transformation and aggregation. BFFs contain zero domain state or core business rules.

5. **Effort consolidation**:
   - Map channel Level-1 items to standardized Core Modules.
   - Consolidate common backend effort via **MAX-dedup** across channels: Core effort equals the maximum effort for each shared sub-feature.
   - Scale channel backend sheets to **BFF ratio (default 15%)**.
   - Review boundary exceptions: never apply consolidation to isolated offline channels, pay-per-deliverable contracts, or jurisdiction-mandated separate backends.
   - Detail: `harnix skill harnix-arch-review --reference wbs-consolidation`.

## Review checklist

- [ ] Domain brief aligned with target regulatory landscape (e.g. HIPAA, GDPR, PIPL, Decree 13).
- [ ] Every front-end channel has a single dedicated BFF with no direct cross-BFF calls.
- [ ] Core domain microservices encapsulate domain entities without shared database tables.
- [ ] Effort consolidation preserves formula integrity and accounts for isolated channel exceptions.
