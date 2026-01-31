#!/usr/bin/env node
import { Command } from 'commander'
import pc from 'picocolors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { runRailsGuides, runTurboDocs, runStimulusDocs, runAlpineDocs } from './runner.js'
import { parseRailsVersion, findGemfileLock } from './version-detector.js'
import { promptVersion } from './core/prompts.js'
import { BadInputError, FetchError } from './errors.js'

const program = new Command()

program
  .name('agentdocs')
  .description('Generate documentation indexes for AI coding agents')
  .version('0.2.0')

program
  .command('rails')
  .description('Fetch Rails guides documentation via sparse-checkout')
  .option('-r, --rails-version <version>', 'Rails version (auto-detected from Gemfile.lock)')
  .option('-o, --output <file>', 'Output file (default: auto-detect CLAUDE.md or AGENTS.md)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-f, --force', 'Force re-download even if cached')
  .action(async (opts) => {
    try {
      let version: string

      if (opts.railsVersion) {
        version = opts.railsVersion
        console.log(pc.blue(`Using specified Rails version: ${version}`))
      } else {
        const cwd = process.cwd()
        const gemfilePath = findGemfileLock(cwd)

        if (!gemfilePath) {
          throw new BadInputError(
            'Gemfile.lock not found. Use --rails-version or run from a Rails project.'
          )
        }

        console.log(pc.dim(`Found ${path.relative(cwd, gemfilePath)}`))
        const content = fs.readFileSync(gemfilePath, 'utf-8')
        const result = parseRailsVersion(content)

        if (result.type === 'git') {
          if (opts.yes) {
            throw new BadInputError(
              'Rails installed from git source. Use --rails-version to specify which Rails version docs to fetch.'
            )
          }
          console.log(pc.yellow('Rails installed from git source.'))
          const prompted = await promptVersion()
          if (!prompted) {
            console.log(pc.dim('Cancelled.'))
            process.exit(0)
          }
          version = prompted
        } else {
          version = result.version
          console.log(pc.blue(`Detected Rails ${version}`))
        }
      }

      await runRailsGuides({
        version,
        output: opts.output,
        yes: opts.yes,
        force: opts.force,
      })
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('turbo')
  .description('Fetch Turbo documentation via sparse-checkout')
  .option('-o, --output <file>', 'Output file (default: auto-detect CLAUDE.md or AGENTS.md)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-f, --force', 'Force re-download even if cached')
  .action(async (opts) => {
    try {
      await runTurboDocs({
        output: opts.output,
        yes: opts.yes,
        force: opts.force,
      })
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('stimulus')
  .description('Fetch Stimulus documentation via sparse-checkout')
  .option('-o, --output <file>', 'Output file (default: auto-detect CLAUDE.md or AGENTS.md)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-f, --force', 'Force re-download even if cached')
  .action(async (opts) => {
    try {
      await runStimulusDocs({
        output: opts.output,
        yes: opts.yes,
        force: opts.force,
      })
    } catch (error) {
      handleError(error)
    }
  })

program
  .command('alpine')
  .description('Fetch Alpine.js documentation via sparse-checkout')
  .option('-o, --output <file>', 'Output file (default: auto-detect CLAUDE.md or AGENTS.md)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-f, --force', 'Force re-download even if cached')
  .action(async (opts) => {
    try {
      await runAlpineDocs({
        output: opts.output,
        yes: opts.yes,
        force: opts.force,
      })
    } catch (error) {
      handleError(error)
    }
  })

function handleError(error: unknown): void {
  if (error instanceof BadInputError) {
    console.error(pc.red(`Error: ${error.message}`))
    process.exit(1)
  }
  if (error instanceof FetchError) {
    console.error(pc.red(`Fetch error: ${error.message}`))
    process.exit(1)
  }
  throw error
}

program.parse()
