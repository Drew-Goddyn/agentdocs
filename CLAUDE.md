# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Background

This project was inspired by Vercel's AGENTS.md approach:
- Blog post: https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals
- Reference implementation: https://github.com/vercel/next.js/pull/88961

## Build and Test Commands

```bash
npm run build          # Build with tsup (outputs to dist/)
npm test               # Run all tests with vitest
npm test -- <file>     # Run specific test file
```

## Architecture

**agentdocs** is a CLI tool that fetches documentation from GitHub repos and injects compact indexes into CLAUDE.md/AGENTS.md files for AI coding agents.

### Core Flow

1. **CLI** (`src/cli.ts`) - Commander.js subcommands: `rails`, `turbo`, `stimulus`
2. **Runner** (`src/runner.ts`) - Orchestrates: fetch tarball → extract → build index → inject into target file
3. **Source Adapters** (`src/sources/`) - Define repo URLs, doc paths, and categorization logic per source

### Key Abstraction: SourceAdapter

All documentation sources implement this interface (`src/types.ts`):

```typescript
interface SourceAdapter {
  name: string
  markerPrefix: string                    // e.g., 'RAILS-AGENTS-MD'
  getTarballUrl: (version?) => string     // GitHub tarball URL
  getDocsPath: (extractedDir) => string   // Path to docs within extracted tarball
  getOutputDir: (version?) => string      // Local cache directory
  categorizeFiles: (files) => Record<string, string[]>  // Group files for compact index
  buildIndexHeader: (version, docsPath) => string       // Index metadata line
}
```

### Directory Structure

- `src/core/` - Reusable utilities (tarball fetching, file injection, gitignore updates)
- `src/sources/` - Source adapters (rails.ts, turbo.ts, stimulus.ts, shared.ts)
- `tests/core/` - Core module tests
- `tests/sources/` - Adapter tests

### Index Injection

Each source uses unique HTML comment markers (e.g., `<!-- RAILS-AGENTS-MD-START -->`) so multiple sources can coexist in the same CLAUDE.md file without conflicts.

## Adding a New Documentation Source

1. Create `src/sources/<name>.ts` implementing `SourceAdapter`
2. Add subcommand in `src/cli.ts`
3. Export adapter from `src/index.ts`
4. Add tests in `tests/sources/<name>.test.ts`
