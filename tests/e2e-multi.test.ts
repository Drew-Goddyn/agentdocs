import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { injectIndexWithMarkers, getMarkers, findTargetFile } from '../src/core/file-injector.js'
import { buildIndexWithAdapter } from '../src/core/index-builder.js'
import { railsAdapter } from '../src/sources/rails.js'
import { turboAdapter } from '../src/sources/turbo.js'
import { stimulusAdapter } from '../src/sources/stimulus.js'

const TEST_DIR = path.join(import.meta.dirname, '.test-multi')

describe('E2E: Multi-source workflow', () => {
  beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('should inject multiple sources into same CLAUDE.md', () => {
    const claudeMd = path.join(TEST_DIR, 'CLAUDE.md')
    fs.writeFileSync(claudeMd, '# My Project\n\nSome content here.\n')

    const railsFiles = ['active_record_basics.md', 'getting_started.md']
    const railsIndex = buildIndexWithAdapter(railsAdapter, railsFiles, '7.1.3', '.rails-docs')
    injectIndexWithMarkers({
      targetFile: claudeMd,
      index: railsIndex,
      markerPrefix: railsAdapter.markerPrefix,
    })

    const turboFiles = ['handbook/01_introduction.md', 'reference/frames.md']
    const turboIndex = buildIndexWithAdapter(turboAdapter, turboFiles, 'main', '.turbo-docs')
    injectIndexWithMarkers({
      targetFile: claudeMd,
      index: turboIndex,
      markerPrefix: turboAdapter.markerPrefix,
    })

    const stimulusFiles = ['handbook/01_introduction.md', 'reference/controllers.md']
    const stimulusIndex = buildIndexWithAdapter(stimulusAdapter, stimulusFiles, 'main', '.stimulus-docs')
    injectIndexWithMarkers({
      targetFile: claudeMd,
      index: stimulusIndex,
      markerPrefix: stimulusAdapter.markerPrefix,
    })

    const content = fs.readFileSync(claudeMd, 'utf-8')

    expect(content).toContain('# My Project')
    expect(content).toContain('Some content here.')

    const railsMarkers = getMarkers(railsAdapter.markerPrefix)
    expect(content).toContain(railsMarkers.START)
    expect(content).toContain(railsMarkers.END)
    expect(content).toContain('[Rails 7.1.3 Docs]')

    const turboMarkers = getMarkers(turboAdapter.markerPrefix)
    expect(content).toContain(turboMarkers.START)
    expect(content).toContain(turboMarkers.END)
    expect(content).toContain('[Turbo Docs]')

    const stimulusMarkers = getMarkers(stimulusAdapter.markerPrefix)
    expect(content).toContain(stimulusMarkers.START)
    expect(content).toContain(stimulusMarkers.END)
    expect(content).toContain('[Stimulus Docs]')
  })

  it('should update specific source without affecting others', () => {
    const claudeMd = path.join(TEST_DIR, 'CLAUDE.md')

    const railsFiles = ['active_record_basics.md']
    const railsIndex = buildIndexWithAdapter(railsAdapter, railsFiles, '7.1.3', '.rails-docs')
    injectIndexWithMarkers({
      targetFile: claudeMd,
      index: railsIndex,
      markerPrefix: railsAdapter.markerPrefix,
    })

    const turboFiles = ['handbook/01_introduction.md']
    const turboIndex = buildIndexWithAdapter(turboAdapter, turboFiles, 'main', '.turbo-docs')
    injectIndexWithMarkers({
      targetFile: claudeMd,
      index: turboIndex,
      markerPrefix: turboAdapter.markerPrefix,
    })

    const updatedRailsFiles = ['active_record_basics.md', 'action_controller_overview.md']
    const updatedRailsIndex = buildIndexWithAdapter(railsAdapter, updatedRailsFiles, '8.0.0', '.rails-docs')
    injectIndexWithMarkers({
      targetFile: claudeMd,
      index: updatedRailsIndex,
      markerPrefix: railsAdapter.markerPrefix,
    })

    const content = fs.readFileSync(claudeMd, 'utf-8')

    expect(content).toContain('[Rails 8.0.0 Docs]')
    expect(content).not.toContain('[Rails 7.1.3 Docs]')

    expect(content).toContain('[Turbo Docs]')
  })

  it('should find correct target file', () => {
    const claudeMd = path.join(TEST_DIR, 'CLAUDE.md')
    fs.writeFileSync(claudeMd, '# Claude')

    const result = findTargetFile(TEST_DIR)
    expect(result).toBe(claudeMd)
  })

  it('should prefer CLAUDE.md over AGENTS.md', () => {
    fs.writeFileSync(path.join(TEST_DIR, 'CLAUDE.md'), '# Claude')
    fs.writeFileSync(path.join(TEST_DIR, 'AGENTS.md'), '# Agents')

    const result = findTargetFile(TEST_DIR)
    expect(result).toBe(path.join(TEST_DIR, 'CLAUDE.md'))
  })
})
