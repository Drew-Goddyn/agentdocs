import * as fs from 'node:fs'
import * as path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import * as tar from 'tar'
import { FetchError } from './errors.js'
import { versionToTarballUrl } from './version-detector.js'
import type { FetchOptions } from './types.js'

export interface FetchResult {
  docsPath: string
  cached: boolean
}

export async function downloadAndExtract(options: FetchOptions): Promise<FetchResult> {
  const { version, force = false, outputDir = '.rails-docs' } = options
  const versionDir = path.join(outputDir, `rails-${version}`)

  if (!force && fs.existsSync(versionDir)) {
    return { docsPath: versionDir, cached: true }
  }

  if (force && fs.existsSync(versionDir)) {
    fs.rmSync(versionDir, { recursive: true })
  }

  fs.mkdirSync(outputDir, { recursive: true })

  const url = versionToTarballUrl(version)
  const response = await fetch(url, { redirect: 'follow' })

  if (!response.ok) {
    if (response.status === 404) {
      throw new FetchError(`Rails version ${version} not found. Check it exists as a git tag.`, 404)
    }
    throw new FetchError(`Failed to fetch tarball: ${response.statusText}`, response.status)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const tempDir = path.join(outputDir, `.temp-${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    await pipeline(
      Readable.from(buffer),
      tar.extract({
        cwd: tempDir,
        filter: (entryPath) => entryPath.includes('/guides/source/'),
      })
    )

    const extractedDirs = fs.readdirSync(tempDir)
    const railsDir = extractedDirs.find(d => d.startsWith('rails-'))

    if (railsDir) {
      fs.renameSync(path.join(tempDir, railsDir), versionDir)
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }

  return { docsPath: versionDir, cached: false }
}

export function collectMdFiles(docsPath: string): string[] {
  const files: string[] = []

  function walk(dir: string): void {
    if (path.basename(dir) === 'epub') return

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  walk(docsPath)
  return files
}
