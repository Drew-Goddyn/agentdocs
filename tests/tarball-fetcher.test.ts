import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { downloadAndExtract, collectMdFiles } from '../src/tarball-fetcher.js'
import { FetchError } from '../src/errors.js'

const FIXTURES_DIR = path.join(import.meta.dirname, 'fixtures')
const TEST_OUTPUT_DIR = path.join(import.meta.dirname, '.test-output')

describe('downloadAndExtract', () => {
  beforeEach(() => {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('should download and extract tarball to output directory', async () => {
    const fixtureBuffer = fs.readFileSync(path.join(FIXTURES_DIR, 'mini-rails.tar.gz'))

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fixtureBuffer.buffer.slice(fixtureBuffer.byteOffset, fixtureBuffer.byteOffset + fixtureBuffer.byteLength),
    } as Response)

    const result = await downloadAndExtract({
      version: '7.1.0',
      outputDir: TEST_OUTPUT_DIR,
    })

    expect(result.docsPath).toContain('rails-7.1.0')
    expect(fs.existsSync(result.docsPath)).toBe(true)

    const files = fs.readdirSync(path.join(result.docsPath, 'guides', 'source'))
    expect(files).toContain('active_record_basics.md')
    expect(files).toContain('getting_started.md')
  })

  it('should use cached version when available and force is false', async () => {
    const cachedDir = path.join(TEST_OUTPUT_DIR, 'rails-7.1.0', 'guides', 'source')
    fs.mkdirSync(cachedDir, { recursive: true })
    fs.writeFileSync(path.join(cachedDir, 'cached.md'), '# Cached')

    const fetchSpy = vi.spyOn(global, 'fetch')

    const result = await downloadAndExtract({
      version: '7.1.0',
      outputDir: TEST_OUTPUT_DIR,
      force: false,
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.cached).toBe(true)
  })

  it('should re-download when force is true even if cached', async () => {
    const cachedDir = path.join(TEST_OUTPUT_DIR, 'rails-7.1.0', 'guides', 'source')
    fs.mkdirSync(cachedDir, { recursive: true })
    fs.writeFileSync(path.join(cachedDir, 'cached.md'), '# Cached')

    const fixtureBuffer = fs.readFileSync(path.join(FIXTURES_DIR, 'mini-rails.tar.gz'))

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fixtureBuffer.buffer.slice(fixtureBuffer.byteOffset, fixtureBuffer.byteOffset + fixtureBuffer.byteLength),
    } as Response)

    const result = await downloadAndExtract({
      version: '7.1.0',
      outputDir: TEST_OUTPUT_DIR,
      force: true,
    })

    expect(result.cached).toBe(false)
    expect(fs.existsSync(path.join(cachedDir, 'cached.md'))).toBe(false)
  })

  it('should throw FetchError with 404 for invalid version', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response)

    await expect(downloadAndExtract({
      version: '99.99.99',
      outputDir: TEST_OUTPUT_DIR,
    })).rejects.toThrow(FetchError)

    await expect(downloadAndExtract({
      version: '99.99.99',
      outputDir: TEST_OUTPUT_DIR,
    })).rejects.toThrow('Rails version 99.99.99 not found')
  })

  it('should throw FetchError on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    await expect(downloadAndExtract({
      version: '7.1.0',
      outputDir: TEST_OUTPUT_DIR,
    })).rejects.toThrow('Network error')
  })
})

describe('collectMdFiles', () => {
  beforeEach(() => {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
  })

  it('should return only .md files', () => {
    const sourceDir = path.join(TEST_OUTPUT_DIR, 'guides', 'source')
    fs.mkdirSync(sourceDir, { recursive: true })
    fs.writeFileSync(path.join(sourceDir, 'guide1.md'), '# Guide 1')
    fs.writeFileSync(path.join(sourceDir, 'guide2.md'), '# Guide 2')
    fs.writeFileSync(path.join(sourceDir, 'template.erb'), '<%= erb %>')
    fs.writeFileSync(path.join(sourceDir, 'config.yaml'), 'key: value')

    const files = collectMdFiles(sourceDir)

    expect(files).toHaveLength(2)
    expect(files.every(f => f.endsWith('.md'))).toBe(true)
  })

  it('should exclude epub directory', () => {
    const sourceDir = path.join(TEST_OUTPUT_DIR, 'guides', 'source')
    const epubDir = path.join(sourceDir, 'epub')
    fs.mkdirSync(epubDir, { recursive: true })
    fs.writeFileSync(path.join(sourceDir, 'guide.md'), '# Guide')
    fs.writeFileSync(path.join(epubDir, 'epub_guide.md'), '# Epub Guide')

    const files = collectMdFiles(sourceDir)

    expect(files).toHaveLength(1)
    expect(files[0]).not.toContain('epub')
  })
})
