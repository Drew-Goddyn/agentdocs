import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { runSource } from '../src/runner.js'
import { turboAdapter } from '../src/sources/turbo.js'

const FIXTURES_DIR = path.join(import.meta.dirname, 'fixtures')
const TEST_DIR = path.join(import.meta.dirname, '.test-runner')

describe('runSource tarball filtering', () => {
  beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
    fs.mkdirSync(TEST_DIR, { recursive: true })
    fs.writeFileSync(path.join(TEST_DIR, 'CLAUDE.md'), '# Test Project\n')
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('should only extract docs path, not framework source code', async () => {
    const fixtureBuffer = fs.readFileSync(path.join(FIXTURES_DIR, 'mini-turbo.tar.gz'))

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fixtureBuffer.buffer.slice(fixtureBuffer.byteOffset, fixtureBuffer.byteOffset + fixtureBuffer.byteLength),
    } as Response)

    vi.spyOn(console, 'log').mockImplementation(() => {})

    const originalCwd = process.cwd()
    process.chdir(TEST_DIR)

    try {
      await runSource(turboAdapter, { version: 'main', yes: true })

      const outputDir = path.join(TEST_DIR, '.turbo-docs')

      expect(fs.existsSync(outputDir)).toBe(true)

      const claudeMd = fs.readFileSync(path.join(TEST_DIR, 'CLAUDE.md'), 'utf-8')
      expect(claudeMd).toContain('<!-- TURBO-AGENTS-MD-START -->')
      expect(claudeMd).toContain('<!-- TURBO-AGENTS-MD-END -->')
    } finally {
      process.chdir(originalCwd)
    }
  })
})
