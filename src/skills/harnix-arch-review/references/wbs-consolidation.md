# WBS extraction and effort consolidation

Mathematical and structural guidelines for enterprise WBS parsing, three-way gap analysis, and Core MAX-deduplication with BFF ratio scaling.

## 1. WBS parsing discipline
- Locate the Backend effort column dynamically across heterogeneous channel sheets.
- Forward-fill top-level grouping indicators (Level-1 categories and Level-2 sub-features) down to child rows.
- Reconcile computed sums against sheet-level statistics rows (e.g. Row 13) to prevent column alignment drift.

## 2. Three-way gap analysis
Classify review findings across two orthogonal axes:
- **Missing (Thiếu)**:
  - Axis 1: Stated in customer requirements but absent from WBS.
  - Axis 2: Industry-standard implicit requirements (e.g. cold-chain tracking in pharma, AML checks in banking) omitted by both customer and WBS.
- **Over-scope (Thừa)**:
  - Present in WBS but unrequested by customer and non-standard for the domain.
- **Misaligned (Chưa hợp lý)**:
  - Inappropriate feature hierarchy, misplaced responsibilities, or empty scaffolding sheets.

## 3. Core MAX-deduplication formula
When multiple front-end channels independently estimate common backend capabilities, consolidate shared effort into an enterprise Core Domain sheet:

1. Map each Level-1 category to a canonical Core Module `m`.
2. For each unique sub-feature `f` within Core Module `m`, compute the consolidated Core effort as the maximum estimated backend effort across all channels `c`:
   $$\text{Core Effort}(m, f) = \max_{c \in \text{Channels}} \text{BE}_{c, m, f}$$
3. Sum across all features to determine total consolidated Core effort:
   $$\text{Total Core BE} = \sum_{(m, f)} \text{Core Effort}(m, f)$$

## 4. BFF scaling
In each original channel sheet:
1. Re-label the `Backend` column header to `BFF`.
2. Scale effort from the summary row down by the target BFF ratio `r_bff`:
   $$\text{BFF Effort}_{c} = r_{\text{BFF}} \times \text{Original BE}_{c}$$
3. Standard benchmark ratio `r_bff`:
   - Banking / Insurance / Healthcare: 10% – 12%
   - Pharma / E-commerce / SaaS: 15% (default baseline)
   - Logistics / Manufacturing IoT: 15% – 20%
4. Calculate net development effort savings:
   $$\text{Net Savings} = \sum_{c} \text{Original BE}_{c} - \left( \text{Total Core BE} + \sum_{c} \text{BFF Effort}_{c} \right)$$
   Standard target savings range: **25% – 60%**.

## 5. Non-applicability exceptions
Never apply Core MAX-deduplication and BFF scaling in the following scenarios:
- **Offline / Autonomous channels**: A sub-system requiring full local persistence and independent edge business logic (e.g. an offline-first POS cash register with local inventory).
- **Pay-per-deliverable contracts**: Fixed-scope billing where commercial terms mandate separate per-channel deliverables without shared reuse.
- **Regulatory isolation**: Legal jurisdictions requiring strictly segregated backend databases and physical infrastructure per customer segment.
