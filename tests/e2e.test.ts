import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  parseRailsVersion,
  downloadAndExtract,
  collectMdFiles,
  buildCompactIndex,
  injectIndex,
  updateGitignore,
  BadInputError,
} from '../src/index.js'

const FIXTURES_DIR = path.join(import.meta.dirname, 'fixtures')
const TEST_DIR = path.join(import.meta.dirname, '.test-e2e')

const MOCK_GEMFILE_LOCK = `
GEM
  remote: https://rubygems.org/
  specs:
    actioncable (7.1.3)
    rails (7.1.3)
      actioncable (= 7.1.3)

PLATFORMS
  ruby
`

const MOCK_GEMFILE_LOCK_GIT = `
GIT
  remote: https://github.com/rails/rails.git
  revision: abc123
  branch: main
  specs:
    rails (8.0.0.alpha)

GEM
  remote: https://rubygems.org/
  specs:
    rack (3.0.0)
`

describe('E2E: Full workflow', () => {
  beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('should complete full workflow with mocked fetch', async () => {
    const fixtureBuffer = fs.readFileSync(path.join(FIXTURES_DIR, 'mini-rails.tar.gz'))

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fixtureBuffer.buffer.slice(
        fixtureBuffer.byteOffset,
        fixtureBuffer.byteOffset + fixtureBuffer.byteLength
      ),
    } as Response)

    const result = parseRailsVersion(MOCK_GEMFILE_LOCK)
    expect(result).toEqual({ type: 'version', version: '7.1.3' })

    const version = (result as { type: 'version'; version: string }).version
    const outputDir = path.join(TEST_DIR, '.rails-docs')

    const fetchResult = await downloadAndExtract({
      version,
      outputDir,
    })

    expect(fetchResult.cached).toBe(false)
    expect(fs.existsSync(fetchResult.docsPath)).toBe(true)

    const guidesPath = path.join(fetchResult.docsPath, 'guides', 'source')
    const mdFiles = collectMdFiles(guidesPath)
    expect(mdFiles.length).toBeGreaterThan(0)

    const index = buildCompactIndex({
      files: mdFiles,
      version,
      docsPath: '.rails-docs/rails-7.1.3/guides/source',
    })

    expect(index).toContain('[Rails 7.1.3 Docs]')

    const claudeMd = path.join(TEST_DIR, 'CLAUDE.md')
    injectIndex({ targetFile: claudeMd, index })

    expect(fs.existsSync(claudeMd)).toBe(true)
    const content = fs.readFileSync(claudeMd, 'utf-8')
    expect(content).toContain('RAILS-AGENTS-MD-START')

    updateGitignore(TEST_DIR)
    const gitignore = fs.readFileSync(path.join(TEST_DIR, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('.rails-docs/')
  })

  it('should return cached result on second run', async () => {
    const fixtureBuffer = fs.readFileSync(path.join(FIXTURES_DIR, 'mini-rails.tar.gz'))

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fixtureBuffer.buffer.slice(
        fixtureBuffer.byteOffset,
        fixtureBuffer.byteOffset + fixtureBuffer.byteLength
      ),
    } as Response)

    const outputDir = path.join(TEST_DIR, '.rails-docs')

    const firstRun = await downloadAndExtract({
      version: '7.1.0',
      outputDir,
    })
    expect(firstRun.cached).toBe(false)

    const secondRun = await downloadAndExtract({
      version: '7.1.0',
      outputDir,
    })
    expect(secondRun.cached).toBe(true)
  })

  it('should re-download with force flag', async () => {
    const fixtureBuffer = fs.readFileSync(path.join(FIXTURES_DIR, 'mini-rails.tar.gz'))
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fixtureBuffer.buffer.slice(
        fixtureBuffer.byteOffset,
        fixtureBuffer.byteOffset + fixtureBuffer.byteLength
      ),
    } as Response)

    const outputDir = path.join(TEST_DIR, '.rails-docs')

    await downloadAndExtract({ version: '7.1.0', outputDir })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await downloadAndExtract({ version: '7.1.0', outputDir, force: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('should detect git-source Rails', () => {
    const result = parseRailsVersion(MOCK_GEMFILE_LOCK_GIT)
    expect(result).toEqual({ type: 'git', ref: 'main' })
  })

  it('should throw error when Rails gem not found', () => {
    const noRails = `
GEM
  specs:
    rack (3.0.0)
`
    expect(() => parseRailsVersion(noRails)).toThrow(BadInputError)
    expect(() => parseRailsVersion(noRails)).toThrow('Rails gem not found')
  })
})
