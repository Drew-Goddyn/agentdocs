import { describe, it, expect } from 'vitest'
import { railsAdapter } from '../../src/sources/rails.js'

describe('railsAdapter', () => {
  it('should have correct name', () => {
    expect(railsAdapter.name).toBe('rails')
  })

  it('should have correct marker prefix', () => {
    expect(railsAdapter.markerPrefix).toBe('RAILS-AGENTS-MD')
  })

  it('should return correct output directory', () => {
    const dir = railsAdapter.getOutputDir('7.1.3')
    expect(dir).toBe('.rails-docs/7.1.3')
  })

  it('should return docs path as the output dir', () => {
    const path = railsAdapter.getDocsPath('/tmp/.rails-docs/7.1.3')
    expect(path).toBe('/tmp/.rails-docs/7.1.3')
  })

  it('should categorize files by directory', () => {
    const files = [
      'active_record_basics.md',
      'active_record_querying.md',
      'getting_started.md',
    ]
    const categories = railsAdapter.categorizeFiles(files)

    expect(categories['.']).toContain('active_record_basics')
    expect(categories['.']).toContain('active_record_querying')
    expect(categories['.']).toContain('getting_started')
  })

  it('should build correct index header', () => {
    const header = railsAdapter.buildIndexHeader('7.1.3', '.rails-docs/7.1.3')

    expect(header).toContain('[Rails 7.1.3 Guides]')
    expect(header).toContain('root:.rails-docs/7.1.3')
    expect(header).toContain('STOP. Rails knowledge outdated.')
    expect(header).toContain('npx agentdocs rails')
  })
})
