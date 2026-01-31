import { describe, it, expect } from 'vitest'
import { alpineAdapter, isSubstantialMarkdown } from '../../src/sources/alpine.js'

describe('alpineAdapter', () => {
  it('should have correct name', () => {
    expect(alpineAdapter.name).toBe('alpine')
  })

  it('should have correct marker prefix', () => {
    expect(alpineAdapter.markerPrefix).toBe('ALPINE-AGENTS-MD')
  })

  it('should return git URL', () => {
    const url = alpineAdapter.getTarballUrl()
    expect(url).toBe('https://github.com/alpinejs/alpine.git')
  })

  it('should return docs path as the output dir', () => {
    const path = alpineAdapter.getDocsPath('/tmp/.alpine-docs')
    expect(path).toBe('/tmp/.alpine-docs')
  })

  it('should return correct output directory', () => {
    const dir = alpineAdapter.getOutputDir()
    expect(dir).toBe('.alpine-docs')
  })

  it('should categorize Alpine.js files by directory', () => {
    const files = [
      'directives/x-data.md',
      'directives/x-bind.md',
      'plugins/anchor.md',
      'plugins/collapse.md',
      'magics/$el.md',
      'magics/$refs.md',
      'globals/Alpine.data.md',
      'essentials/installation.md',
    ]
    const categories = alpineAdapter.categorizeFiles(files)

    expect(categories['directives']).toBeDefined()
    expect(categories['directives']).toContain('x-data')
    expect(categories['directives']).toContain('x-bind')
    expect(categories['plugins']).toBeDefined()
    expect(categories['plugins']).toContain('anchor')
    expect(categories['plugins']).toContain('collapse')
    expect(categories['magics']).toBeDefined()
    expect(categories['magics']).toContain('$el')
    expect(categories['magics']).toContain('$refs')
    expect(categories['globals']).toBeDefined()
    expect(categories['globals']).toContain('Alpine.data')
    expect(categories['essentials']).toBeDefined()
    expect(categories['essentials']).toContain('installation')
  })

  it('should handle root-level files', () => {
    const files = ['start-here.md', 'upgrade-guide.md']
    const categories = alpineAdapter.categorizeFiles(files)

    expect(categories['_root']).toBeDefined()
    expect(categories['_root']).toContain('start-here')
    expect(categories['_root']).toContain('upgrade-guide')
  })

  it('should build correct index header', () => {
    const header = alpineAdapter.buildIndexHeader('main', '.alpine-docs')

    expect(header).toContain('[Alpine.js Docs]')
    expect(header).toContain('root:.alpine-docs')
    expect(header).toContain('npx agentdocs alpine')
  })
})

describe('isSubstantialMarkdown', () => {
  it('should reject frontmatter-only files', () => {
    const frontmatterOnly = `---
order: 4
title: Directives
prefix: x-
type: sub-directory
---
`
    expect(isSubstantialMarkdown(frontmatterOnly)).toBe(false)
  })

  it('should accept files with real content after frontmatter', () => {
    const withContent = `---
order: 1
title: Start Here
---

# Start Here

Create a blank HTML file somewhere on your computer.
`
    expect(isSubstantialMarkdown(withContent)).toBe(true)
  })

  it('should accept files without frontmatter that have content', () => {
    const noFrontmatter = `# Installation

Install Alpine.js via CDN or npm.
`
    expect(isSubstantialMarkdown(noFrontmatter)).toBe(true)
  })

  it('should reject empty files', () => {
    expect(isSubstantialMarkdown('')).toBe(false)
  })

  it('should reject whitespace-only files', () => {
    expect(isSubstantialMarkdown('   \n\n  ')).toBe(false)
  })
})
