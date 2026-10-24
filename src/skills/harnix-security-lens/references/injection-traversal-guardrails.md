# Security Guardrails: Injection & Path Traversal Defense

## 1. Nature of Untrusted Input Vulnerabilities
All data originating from users, environment variables, command-line flags, or external files must be handled as untrusted input.
The two highest-severity vulnerability classes in developer tooling and CLI harnesses are:
1. **Command / Shell Injection**: Concatenating unsanitized input into command strings executed via shell interpreters.
2. **Directory / Path Traversal & Symlink Escape**: Exploiting `..`, UNC paths, symbolic links, or NTFS junctions to access or overwrite sensitive files outside intended repository boundaries.

## 2. Invariant Defense Standards

### 2.1. Strict Prohibition of Shell String Concatenation
- **Never use**: `child_process.exec(commandString)` or `Process.Start("cmd.exe", "/c " + input)`.
- **Always use**: Executable-plus-arguments arrays with shell execution explicitly disabled:
  ```typescript
  // Invariant safe execution:
  spawn(executablePath, [arg1, arg2], { shell: false });
  ```
- If invocation of user-defined shell shims is required, look up the absolute binary path on `PATH` and disallow arbitrary metacharacter concatenation.

### 2.2. Canonical Path Pinning & Traversal Defense
When accepting arbitrary filesystem paths:
1. **Resolve Absolute Path**: Invoke `path.resolve()` or `Path.GetFullPath()`.
2. **Canonical Realpath Resolution**: Call `fs.realpath()` to resolve symbolic links and directory junctions.
3. **Root Boundary Pinning**: Assert that the real target path starts with the real root directory prefix:
   ```typescript
   function assertSafePath(targetPath: string, rootDir: string): string {
     const resolved = path.resolve(rootDir, targetPath);
     const realRoot = fs.realpathSync(rootDir);
     const realTarget = fs.realpathSync(resolved);
     if (!realTarget.startsWith(realRoot + path.sep) && realTarget !== realRoot) {
       throw new Error(`Path traversal attempt detected: ${targetPath}`);
     }
     return realTarget;
   }
   ```

### 2.3. Bounded Input Validation
- **Size Caps**: Impose hard size ceilings (e.g., stdin input capped at 64 KiB) to prevent memory-exhaustion denial of service.
- **Forbidden Characters**: Reject NUL bytes (`\0`), raw ASCII control codes, and malformed UTF-8/BOM markers immediately.
- **Strict Whitelisting**: Validate identifiers, slugs, filenames, and dates against anchored regular expressions instead of generic free-form text.

### 2.4. Secret Isolation & Redaction
- Never print API credentials, tokens, passwords, private keys, or machine-specific absolute home directories to logs, task artifacts, or public outputs.
- Redact detected secrets deterministically using pattern matching before persisting diagnostics.
