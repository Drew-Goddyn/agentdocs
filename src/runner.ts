import * as fs from 'node:fs'
import * as path from 'node:path'
import pc from 'picocolors'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import * as tar from 'tar'
import type { SourceAdapter } from './types.js'
import { buildIndexWithAdapter } from './core/index-builder.js'
import { injectIndexWithMarkers, findTargetFile } from './core/file-injector.js'
import { updateGitignore } from './core/gitignore-updater.js'
import { FetchError } from './errors.js'
import { promptConfirm } from './core/prompts.js'

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
    return
  }

  if (!options.yes && !isCached) {
    const confirmed = await promptConfirm(`Download ${adapter.name} docs?`)
    if (!confirmed) {
      console.log(pc.dim('Cancelled.'))
      process.exit(0)
    }
  }

  const fetchResult = await downloadAndExtractGeneric(adapter, version, outputDir, options.force)

  console.log(pc.dim('Building index...'))
  const docsPath = adapter.getDocsPath(fetchResult.extractedDir)
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

  updateGitignoreForAdapter(cwd, adapter)
  console.log(pc.green('✓ Updated .gitignore'))

  console.log(pc.green(`\n✓ ${adapter.name} docs ready!`))
}

interface FetchResult {
  extractedDir: string
  cached: boolean
}

async function downloadAndExtractGeneric(
  adapter: SourceAdapter,
  version: string,
  outputDir: string,
  force?: boolean
): Promise<FetchResult> {
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
      tar.extract({ cwd: tempDir })
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

    return { extractedDir: outputDir, cached: false }
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

function updateGitignoreForAdapter(projectDir: string, adapter: SourceAdapter): void {
  const gitignorePath = path.join(projectDir, '.gitignore')
  const entry = adapter.getOutputDir().replace(/^\./, '') + '/'

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, '.' + entry + '\n')
    return
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8')
  const fullEntry = '.' + entry

  if (content.includes(fullEntry)) {
    return
  }

  const newContent = content.trimEnd() + '\n' + fullEntry + '\n'
  fs.writeFileSync(gitignorePath, newContent)
}
