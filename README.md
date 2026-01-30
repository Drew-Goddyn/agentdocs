# agentdocs

Fetch documentation for Rails, Turbo, and Stimulus and inject compact indexes into your `CLAUDE.md` or `AGENTS.md` for AI coding agents.

Inspired by [Vercel's AGENTS.md approach](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals).

## Installation

```bash
npx @drew-goddyn/agentdocs <command>
```

Or install globally:

```bash
npm install -g @drew-goddyn/agentdocs
```

## Usage

### Rails

Auto-detects Rails version from `Gemfile.lock`:

```bash
npx @drew-goddyn/agentdocs rails
```

Or specify a version:

```bash
npx @drew-goddyn/agentdocs rails --rails-version 7.1.3
```

### Turbo

```bash
npx @drew-goddyn/agentdocs turbo
```

### Stimulus

```bash
npx @drew-goddyn/agentdocs stimulus
```

## What it does

1. Downloads documentation from the official GitHub repos
2. Builds a compact pipe-delimited index of available docs
3. Injects the index into your `CLAUDE.md` (or `AGENTS.md`) with unique markers
4. Adds the docs cache directory to `.gitignore`

Each source uses unique markers, so you can use all three in the same project:

```markdown
<!-- RAILS-AGENTS-MD-START -->
[Rails 7.1.3 Docs]|root:.rails-docs/rails-7.1.3/guides/source|...
<!-- RAILS-AGENTS-MD-END -->

<!-- TURBO-AGENTS-MD-START -->
[Turbo Docs]|root:.turbo-docs/_source|...
<!-- TURBO-AGENTS-MD-END -->

<!-- STIMULUS-AGENTS-MD-START -->
[Stimulus Docs]|root:.stimulus-docs/_source|...
<!-- STIMULUS-AGENTS-MD-END -->
```

## Options

| Flag | Description |
|------|-------------|
| `-o, --output <file>` | Output file (default: auto-detect CLAUDE.md or AGENTS.md) |
| `-y, --yes` | Skip confirmation prompts |
| `-f, --force` | Force re-download even if cached |
| `-r, --rails-version <version>` | Rails version (rails command only) |

## How agents use this

When an AI agent reads your `CLAUDE.md`, it sees:
- The root path to the docs (e.g., `.rails-docs/rails-7.1.3/guides/source`)
- A categorized index of available documentation
- A reminder to search docs before relying on training data

The agent can then read specific docs as needed rather than hallucinating outdated information.

## License

MIT
