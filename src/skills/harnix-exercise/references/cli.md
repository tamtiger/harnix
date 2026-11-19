# Running a CLI or a library as its consumer

## CLI

Run the built command, not its internals, and assert what a user sees.

- Launch with an executable plus an argument array. Never build a shell string from text you did not write; a path or value with spaces or a `|` is then just an argument.
- Assert `stdout`, `stderr` and the exit code separately. Success is exit code 0 with the expected output; an error case asserts a non-zero code and a message on `stderr`, not a stack trace.
- Machine output (JSON) is parsed and compared by field, not by string; human output asserts the lines that matter, not the whole text.
- Run in a temporary directory with a temporary home or config location (set the relevant environment variables) so the run neither reads nor changes the developer's files.
- Give every run a timeout; a command that waits for input gets closed stdin.
- Scenarios: the documented usage, a missing or invalid argument, an unknown flag, a missing input file, a second run on the same output (overwrite or refuse as documented), `--help` exits 0.
- Windows and POSIX: invoke the real executable for the platform; on Windows a `.cmd` shim needs the shell, so prefer the underlying program. Normalize line endings and path separators before comparing output.

## Library

Exercise it the way a consumer does, not through its source tree.

1. Build or pack it the project's own way.
2. In a temporary directory create a tiny consumer (a script or minimal project) that depends on the packed artifact.
3. Import the public entry point only, call the documented functions with a happy, a boundary and an error input, and assert results and thrown errors.
4. Check what the package exports and declares: the entry points resolve, types or typings are present, no internal path is needed.

A passing library test inside the repository does not prove the packaged artifact works; the consumer script does.

## Evidence

Keep the commands, their outputs and the exit codes of the consumer run, with secrets and personal data redacted. Record the run with `harnix workflow --run-check` as described in `evidence`.
