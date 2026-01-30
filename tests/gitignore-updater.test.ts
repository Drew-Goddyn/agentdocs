import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { updateGitignore } from '../src/gitignore-updater.js'

const TEST_DIR = path.join(import.meta.dirname, '.test-gitignore')

describe('updateGitignore', () => {
  beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should create .gitignore with .rails-docs/ entry', () => {
    updateGitignore(TEST_DIR)

    const content = fs.readFileSync(path.join(TEST_DIR, '.gitignore'), 'utf-8')
    expect(content).toContain('.rails-docs/')
  })

  it('should add entry to existing .gitignore', () => {
    fs.writeFileSync(path.join(TEST_DIR, '.gitignore'), 'node_modules/\n.env\n')

    updateGitignore(TEST_DIR)

    const content = fs.readFileSync(path.join(TEST_DIR, '.gitignore'), 'utf-8')
    expect(content).toContain('node_modules/')
    expect(content).toContain('.env')
    expect(content).toContain('.rails-docs/')
  })

  it('should not duplicate entry if already present', () => {
    fs.writeFileSync(path.join(TEST_DIR, '.gitignore'), 'node_modules/\n.rails-docs/\n')

    updateGitignore(TEST_DIR)

    const content = fs.readFileSync(path.join(TEST_DIR, '.gitignore'), 'utf-8')
    const matches = content.match(/\.rails-docs\//g)
    expect(matches).toHaveLength(1)
  })
})
