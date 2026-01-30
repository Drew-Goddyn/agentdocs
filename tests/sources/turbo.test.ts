import { describe, it, expect } from 'vitest'
import { turboAdapter } from '../../src/sources/turbo.js'

describe('turboAdapter', () => {
  it('should have correct name', () => {
    expect(turboAdapter.name).toBe('turbo')
  })

  it('should have correct marker prefix', () => {
    expect(turboAdapter.markerPrefix).toBe('TURBO-AGENTS-MD')
  })

  it('should generate correct tarball URL', () => {
    const url = turboAdapter.getTarballUrl()
    expect(url).toBe('https://github.com/hotwired/turbo-site/archive/refs/heads/main.tar.gz')
  })

  it('should return correct docs path', () => {
    const path = turboAdapter.getDocsPath('/tmp/turbo-site-main')
    expect(path).toBe('/tmp/turbo-site-main/_source')
  })

  it('should return correct output directory', () => {
    const dir = turboAdapter.getOutputDir()
    expect(dir).toBe('.turbo-docs')
  })

  it('should categorize Turbo files by directory', () => {
    const files = [
      'handbook/01_introduction.md',
      'handbook/02_drive.md',
      'handbook/05_streams.md',
      'reference/frames.md',
      'reference/streams.md',
    ]
    const categories = turboAdapter.categorizeFiles(files)

    expect(categories['handbook']).toBeDefined()
    expect(categories['handbook']).toContain('introduction')
    expect(categories['handbook']).toContain('drive')
    expect(categories['handbook']).toContain('streams')
    expect(categories['reference']).toBeDefined()
    expect(categories['reference']).toContain('frames')
    expect(categories['reference']).toContain('streams')
  })

  it('should handle root-level files', () => {
    const files = ['index.md', 'installation.md']
    const categories = turboAdapter.categorizeFiles(files)

    expect(categories['_root']).toBeDefined()
    expect(categories['_root']).toContain('index')
    expect(categories['_root']).toContain('installation')
  })

  it('should build correct index header', () => {
    const header = turboAdapter.buildIndexHeader('main', '.turbo-docs')

    expect(header).toContain('[Turbo Docs]')
    expect(header).toContain('root:.turbo-docs')
    expect(header).toContain('npx agents-md turbo')
  })
})
