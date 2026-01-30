import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import * as tar from 'tar'
import pc from 'picocolors'
import type { SourceAdapter } from './types.js'
import { buildIndexWithAdapter } from './core/index-builder.js'
import { injectIndexWithMarkers, findTargetFile } from './core/file-injector.js'
import { FetchError } from './errors.js'
import { promptConfirm } from './core/prompts.js'
import { railsAdapter } from './sources/rails.js'

export interface RunnerOptions {
  version?: string
  output?: string
  yes?: boolean
  force?: boolean
}

export async function runSource(adapter: SourceAdapter, options: RunnerOptions): Promise<void> {
  const cwd = process.cwd()
  const version = options.version || 'main'

  console.log(pc.blue(`Fetching ${adapter.name} documentation...`))

  const outputDir = path.join(cwd, adapter.getOutputDir(version))
  const isCached = fs.existsSync(outputDir)

  if (isCached && !options.force) {
    console.log(pc.green(`✓ ${adapter.name} docs already cached at ${outputDir}`))
  } else {
    if (!options.yes && !isCached) {
      const confirmed = await promptConfirm(`Download ${adapter.name} docs?`)
      if (!confirmed) {
        console.log(pc.dim('Cancelled.'))
        process.exit(0)
      }
    }

    await downloadAndExtractGeneric(adapter, version, outputDir, options.force)
  }

  console.log(pc.dim('Building index...'))
  const docsPath = adapter.getDocsPath(outputDir)
  const mdFiles = collectMdFilesGeneric(docsPath)
  const relativePath = path.relative(cwd, docsPath)

  const index = buildIndexWithAdapter(adapter, mdFiles, version, relativePath)

  const targetFile = options.output
    ? path.resolve(cwd, options.output)
    : findTargetFile(cwd)

  injectIndexWithMarkers({
    targetFile,
    index,
    markerPrefix: adapter.markerPrefix,
  })
  console.log(pc.green(`✓ Updated ${path.relative(cwd, targetFile)}`))

  updateGitignore(cwd, adapter.getOutputDir() + '/')
  console.log(pc.green('✓ Updated .gitignore'))

  console.log(pc.green(`\n✓ ${adapter.name} docs ready!`))
}

async function cloneGuidesFolder(tag: string, destDir: string): Promise<void> {
  const tempDir = path.join(path.dirname(destDir), `.temp-clone-${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    cloneRailsRepo(tag, tempDir)
    execSync('git sparse-checkout set guides/source', { cwd: tempDir, stdio: 'pipe' })

    const sourceDir = path.join(tempDir, 'guides', 'source')
    if (!fs.existsSync(sourceDir)) {
      throw new FetchError('guides/source folder not found in Rails repository', 404)
    }

    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true })
    }
    fs.mkdirSync(destDir, { recursive: true })
    fs.cpSync(sourceDir, destDir, {
      recursive: true,
      filter: (src) => {
        if (fs.statSync(src).isDirectory()) {
          return !src.endsWith('/epub')
        }
        return src.endsWith('.md')
      },
    })
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true })
    }
  }
}

function cloneRailsRepo(tag: string, tempDir: string): void {
  try {
    execSync(
      `git clone --depth 1 --filter=blob:none --sparse --branch v${tag} https://github.com/rails/rails.git .`,
      { cwd: tempDir, stdio: 'pipe' }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('not found') || message.includes('did not match')) {
      throw new FetchError(
        `Could not find Rails version v${tag}. This version may not exist as a git tag.`,
        404
      )
    }
    throw error
  }
}

export async function runRailsGuides(options: RunnerOptions): Promise<void> {
  const cwd = process.cwd()
  const version = options.version || '7.1.0'

  console.log(pc.blue(`Fetching Rails ${version} guides...`))

  const outputDir = path.join(cwd, `.rails-docs/${version}`)
  const isCached = fs.existsSync(outputDir)

  if (isCached && !options.force) {
    console.log(pc.green(`✓ Rails guides already cached at ${outputDir}`))
  } else {
    if (!options.yes && !isCached) {
      const confirmed = await promptConfirm(`Download Rails ${version} guides?`)
      if (!confirmed) {
        console.log(pc.dim('Cancelled.'))
        process.exit(0)
      }
    }

    if (options.force && fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }

    console.log(pc.dim(`Cloning rails/rails (sparse-checkout guides/source)...`))
    await cloneGuidesFolder(version, outputDir)
    console.log(pc.green(`✓ Downloaded guides`))
  }

  console.log(pc.dim('Building index...'))
  const mdFiles = collectMdFilesGeneric(outputDir)
  const relativePath = path.relative(cwd, outputDir)

  const index = buildIndexWithAdapter(railsAdapter, mdFiles, version, relativePath)

  const targetFile = options.output
    ? path.resolve(cwd, options.output)
    : findTargetFile(cwd)

  injectIndexWithMarkers({
    targetFile,
    index,
    markerPrefix: railsAdapter.markerPrefix,
  })
  console.log(pc.green(`✓ Updated ${path.relative(cwd, targetFile)}`))

  updateGitignore(cwd, '.rails-docs/')
  console.log(pc.green('✓ Updated .gitignore'))

  console.log(pc.green(`\n✓ Rails guides ready!`))
}

async function downloadAndExtractGeneric(
  adapter: SourceAdapter,
  version: string,
  outputDir: string,
  force?: boolean
): Promise<void> {
  if (force && fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true })
  }

  fs.mkdirSync(outputDir, { recursive: true })

  const url = adapter.getTarballUrl(version)
  console.log(pc.dim(`Downloading from ${url}...`))

  const response = await fetch(url, { redirect: 'follow' })

  if (!response.ok) {
    if (response.status === 404) {
      throw new FetchError(`${adapter.name} docs not found at ${url}`, 404)
    }
    throw new FetchError(`Failed to fetch tarball: ${response.statusText}`, response.status)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const tempDir = path.join(path.dirname(outputDir), `.temp-${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    await pipeline(
      Readable.from(buffer),
      tar.extract({
        cwd: tempDir,
        filter: adapter.getDocsFilter,
      })
    )

    const extractedDirs = fs.readdirSync(tempDir)
    const extractedDir = extractedDirs[0]

    if (extractedDir) {
      const sourcePath = path.join(tempDir, extractedDir)
      const entries = fs.readdirSync(sourcePath)
      for (const entry of entries) {
        fs.renameSync(
          path.join(sourcePath, entry),
          path.join(outputDir, entry)
        )
      }
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function collectMdFilesGeneric(docsPath: string): string[] {
  const files: string[] = []

  function walk(dir: string, relativeTo: string): void {
    if (!fs.existsSync(dir)) return
    if (path.basename(dir) === 'epub') return

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath, relativeTo)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.relative(relativeTo, fullPath))
      }
    }
  }

  walk(docsPath, docsPath)
  return files
}

function updateGitignore(projectDir: string, entry: string): void {
  const gitignorePath = path.join(projectDir, '.gitignore')

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, entry + '\n')
    return
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8')

  if (content.includes(entry)) {
    return
  }

  fs.writeFileSync(gitignorePath, content.trimEnd() + '\n' + entry + '\n')
}
