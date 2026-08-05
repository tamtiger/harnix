#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("harnix")
  .description("Project-local coding-agent harness for Kiro, Antigravity, and Codex.")
  .version("0.1.0")
  .showSuggestionAfterError();

program.parse();
