---
name: harnix-security-lens
description: Use when reviewing or implementing security-critical code paths including untrusted input boundaries, command execution, path traversal and credential handling.
metadata:
  version: "2.18.0"
---

# Security review lens

Inspect attack surfaces across path resolution, child process invocation, untrusted text processing, and secret confidentiality.

## Evidence and Rationale

Evidence source: `research/external-research.md` (§A2 lines 45, 51 on cross-language security patterns and security review lenses, and Harnix Product Boundaries in `AGENTS.md` rules 1 and 8).
Coding agents interact directly with host filesystems, processes, and network boundaries. Systematic defense against directory traversal, command injection, and credential exposure is non-negotiable.

## When to use

- When accepting user-supplied, repository-derived, or LLM-generated paths, commands, or arguments.
- When spawning child processes or interacting with external shells.
- When generating diagnostic logs, review summaries, or persisted artifacts.
- When handling credentials, tokens, or environment variables.
- When authoring database queries, authentication policies, or endpoint handlers.

## Critical vulnerability checks

1. **Path traversal & escape**:
   - Always resolve and canonicalize paths using platform realpath/resolve APIs.
   - Assert that canonical paths start with the verified root boundary.
   - Reject relative traversal sequences (`..`), junction escapes, and unverified symlinks before filesystem access.

2. **Command execution & injection**:
   - Never concatenate untrusted strings into shell command lines.
   - Use direct executable execution with explicit argument arrays (`execFile`, `spawn` without `shell: true`).
   - Where shell invocation is mandatory, sanitize and quote arguments strictly according to target shell rules.

3. **SQL injection & dynamic query rules**:
   - Forbid string concatenation in SQL queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
   - Bind every parameter through parameterized queries, JPA, or EF Core parameter bindings.
   - Enforce resource ownership checks (`@PreAuthorize`, authorization policies) to prevent IDOR (OWASP A01).

4. **Secret confidentiality & logging hygiene**:
   - Never emit absolute machine paths, API keys, passwords, or secret tokens into generated files, logs, or command output.
   - Forbid debug print statements (`System.out.print`, `Console.Write`) in production code; use structured loggers (`SLF4J`, `ILogger`).
   - Mask sensitive personal data (PII) such as emails and phone numbers before logging.
   - Deny access to sensitive files (`.env`, `.env.*`, `*.pem`, `*.key`, `*.jks`, `*.keystore`, `*.p12`, `*.tfstate`).

## Review procedure

1. Identify every entry point where external or user input enters the component.
2. Verify that input is validated and sanitized at the earliest boundary.
3. Verify that all filesystem paths are checked against boundary constraints.
4. Verify that no subprocess or SQL query is created with unquoted or concatenated input.
5. Check all logging and output statements for accidental secret, unmasked PII, or absolute path leakage.
