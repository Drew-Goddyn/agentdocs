#!/usr/bin/env node
import { Command } from 'commander'
import pc from 'picocolors'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseRailsVersion, findGemfileLock } from './version-detector.js'
import { downloadAndExtract, collectMdFiles } from './tarball-fetcher.js'
import { buildCompactIndex } from './index-builder.js'
import { injectIndex, findTargetFile } from './file-injector.js'
import { updateGitignore } from './gitignore-updater.js'
import { BadInputError, FetchError } from './errors.js'
import { promptVersion, promptConfirm } from './prompts.js'
import type { CLIOptions } from './types.js'

const program = new Command()

program
  .name('rails-agents-md')
  .description('Generate Rails documentation indexes for AI coding agents')
  .version('0.1.0')
  .option('-o, --output <file>', 'Output file (default: auto-detect CLAUDE.md or AGENTS.md)')
  .option('-r, --rails-version <version>', 'Rails version (required if Rails installed from git)')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-f, --force', 'Force re-download even if cached')
  .action(run)

async function run(options: CLIOptions): Promise<void> {
  try {
    const cwd = process.cwd()
    let version: string

    if (options.railsVersion) {
      version = options.railsVersion
      console.log(pc.blue(`Using specified Rails version: ${version}`))
    } else {
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
        if (options.yes) {
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

    const outputDir = path.join(cwd, '.rails-docs')
    const versionDir = path.join(outputDir, `rails-${version}`)
    const isCached = fs.existsSync(versionDir)

    if (!isCached && !options.yes) {
      const confirmed = await promptConfirm(`Download Rails ${version} docs?`)
      if (!confirmed) {
        console.log(pc.dim('Cancelled.'))
        process.exit(0)
      }
    }

    const fetchResult = await downloadAndExtract({
      version,
      force: options.force,
      outputDir,
    })

    if (fetchResult.cached && !options.force) {
      console.log(pc.green('✓ Already up to date'))
      return
    }

    console.log(pc.dim('Building index...'))
    const guidesPath = path.join(fetchResult.docsPath, 'guides', 'source')
    const mdFiles = collectMdFiles(guidesPath)
    const index = buildCompactIndex({
      files: mdFiles,
      version,
      docsPath: path.relative(cwd, guidesPath),
    })

    const targetFile = options.output
      ? path.resolve(cwd, options.output)
      : findTargetFile(cwd)

    injectIndex({ targetFile, index })
    console.log(pc.green(`✓ Updated ${path.relative(cwd, targetFile)}`))

    updateGitignore(cwd)
    console.log(pc.green('✓ Updated .gitignore'))

    console.log(pc.green(`\n✓ Rails ${version} docs ready!`))
  } catch (error) {
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
}

program.parse()
