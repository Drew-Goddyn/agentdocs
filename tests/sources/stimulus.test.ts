import { describe, it, expect } from 'vitest'
import { stimulusAdapter } from '../../src/sources/stimulus.js'

describe('stimulusAdapter', () => {
  it('should have correct name', () => {
    expect(stimulusAdapter.name).toBe('stimulus')
  })

  it('should have correct marker prefix', () => {
    expect(stimulusAdapter.markerPrefix).toBe('STIMULUS-AGENTS-MD')
  })

  it('should generate correct tarball URL', () => {
    const url = stimulusAdapter.getTarballUrl()
    expect(url).toBe('https://github.com/hotwired/stimulus-site/archive/refs/heads/main.tar.gz')
  })

  it('should return correct docs path', () => {
    const path = stimulusAdapter.getDocsPath('/tmp/stimulus-site-main')
    expect(path).toBe('/tmp/stimulus-site-main/_source')
  })

  it('should return correct output directory', () => {
    const dir = stimulusAdapter.getOutputDir()
    expect(dir).toBe('.stimulus-docs')
  })

  it('should categorize Stimulus files by directory', () => {
    const files = [
      'handbook/01_introduction.md',
      'handbook/02_hello_stimulus.md',
      'reference/controllers.md',
      'reference/actions.md',
    ]
    const categories = stimulusAdapter.categorizeFiles(files)

    expect(categories['handbook']).toBeDefined()
    expect(categories['handbook']).toContain('introduction')
    expect(categories['handbook']).toContain('hello_stimulus')
    expect(categories['reference']).toBeDefined()
    expect(categories['reference']).toContain('controllers')
    expect(categories['reference']).toContain('actions')
  })

  it('should handle root-level files', () => {
    const files = ['index.md']
    const categories = stimulusAdapter.categorizeFiles(files)

    expect(categories['_root']).toBeDefined()
    expect(categories['_root']).toContain('index')
  })

  it('should build correct index header', () => {
    const header = stimulusAdapter.buildIndexHeader('main', '.stimulus-docs')

    expect(header).toContain('[Stimulus Docs]')
    expect(header).toContain('root:.stimulus-docs')
    expect(header).toContain('npx agentdocs stimulus')
  })
})
