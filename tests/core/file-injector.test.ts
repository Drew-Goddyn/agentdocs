import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { injectIndex, findTargetFile, MARKERS } from '../../src/core/file-injector.js'

const TEST_DIR = path.join(import.meta.dirname, '.test-inject')

describe('injectIndex', () => {
  beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should create new file with index', () => {
    const targetFile = path.join(TEST_DIR, 'CLAUDE.md')
    const index = '[Rails 7.1.3 Docs]|root:.rails-docs'

    injectIndex({ targetFile, index })

    const content = fs.readFileSync(targetFile, 'utf-8')
    expect(content).toContain(MARKERS.START)
    expect(content).toContain(index)
    expect(content).toContain(MARKERS.END)
  })

  it('should update existing markers', () => {
    const targetFile = path.join(TEST_DIR, 'CLAUDE.md')
    const existingContent = `# My Project

Some content here.

${MARKERS.START}
Old index content
${MARKERS.END}

More content below.
`
    fs.writeFileSync(targetFile, existingContent)

    const newIndex = '[Rails 8.0.0 Docs]|root:.rails-docs'
    injectIndex({ targetFile, index: newIndex })

    const content = fs.readFileSync(targetFile, 'utf-8')
    expect(content).toContain('# My Project')
    expect(content).toContain('Some content here.')
    expect(content).toContain(newIndex)
    expect(content).not.toContain('Old index content')
    expect(content).toContain('More content below.')
  })

  it('should append when no markers exist', () => {
    const targetFile = path.join(TEST_DIR, 'CLAUDE.md')
    const existingContent = `# My Project

Some existing content.
`
    fs.writeFileSync(targetFile, existingContent)

    const index = '[Rails 7.1.3 Docs]|root:.rails-docs'
    injectIndex({ targetFile, index })

    const content = fs.readFileSync(targetFile, 'utf-8')
    expect(content).toContain('# My Project')
    expect(content).toContain('Some existing content.')
    expect(content).toContain(MARKERS.START)
    expect(content).toContain(index)
    expect(content).toContain(MARKERS.END)
  })
})

describe('findTargetFile', () => {
  beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should prefer CLAUDE.md', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'CLAUDE.md'), '# Claude')
    fs.writeFileSync(path.join(TEST_DIR, 'AGENTS.md'), '# Agents')

    const result = findTargetFile(TEST_DIR)
    expect(result).toBe(path.join(TEST_DIR, 'CLAUDE.md'))
  })

  it('should fallback to AGENTS.md', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'AGENTS.md'), '# Agents')

    const result = findTargetFile(TEST_DIR)
    expect(result).toBe(path.join(TEST_DIR, 'AGENTS.md'))
  })

  it('should return CLAUDE.md path when neither exists', () => {
    const result = findTargetFile(TEST_DIR)
    expect(result).toBe(path.join(TEST_DIR, 'CLAUDE.md'))
  })
})
