import { describe, it, expect } from 'vitest'
import { railsAdapter } from '../../src/sources/rails.js'

describe('railsAdapter', () => {
  it('should have correct name', () => {
    expect(railsAdapter.name).toBe('rails')
  })

  it('should have correct marker prefix', () => {
    expect(railsAdapter.markerPrefix).toBe('RAILS-AGENTS-MD')
  })

  it('should generate correct tarball URL', () => {
    const url = railsAdapter.getTarballUrl('7.1.3')
    expect(url).toBe('https://github.com/rails/rails/archive/refs/tags/v7.1.3.tar.gz')
  })

  it('should return correct docs path', () => {
    const path = railsAdapter.getDocsPath('/tmp/rails-7.1.3')
    expect(path).toBe('/tmp/rails-7.1.3/guides/source')
  })

  it('should return correct output directory', () => {
    const dir = railsAdapter.getOutputDir('7.1.3')
    expect(dir).toBe('.rails-docs/rails-7.1.3')
  })

  it('should categorize Rails files by prefix', () => {
    const files = [
      'active_record_basics.md',
      'active_record_callbacks.md',
      'active_model_basics.md',
      'getting_started.md',
      'routing.md',
    ]
    const categories = railsAdapter.categorizeFiles(files)

    expect(categories['active_record']).toEqual(['basics', 'callbacks'])
    expect(categories['active_model']).toEqual(['basics'])
    expect(categories['_uncategorized']).toContain('getting_started')
    expect(categories['_uncategorized']).toContain('routing')
  })

  it('should handle all known Rails prefixes', () => {
    const files = [
      'active_record_basics.md',
      'active_model_basics.md',
      'active_job_basics.md',
      'active_storage_overview.md',
      'active_support_core_extensions.md',
      'action_controller_overview.md',
      'action_view_overview.md',
      'action_mailer_basics.md',
      'action_cable_overview.md',
      'action_text_overview.md',
      'action_mailbox_basics.md',
    ]
    const categories = railsAdapter.categorizeFiles(files)

    expect(categories['active_record']).toBeDefined()
    expect(categories['active_model']).toBeDefined()
    expect(categories['active_job']).toBeDefined()
    expect(categories['active_storage']).toBeDefined()
    expect(categories['active_support']).toBeDefined()
    expect(categories['action_controller']).toBeDefined()
    expect(categories['action_view']).toBeDefined()
    expect(categories['action_mailer']).toBeDefined()
    expect(categories['action_cable']).toBeDefined()
    expect(categories['action_text']).toBeDefined()
    expect(categories['action_mailbox']).toBeDefined()
  })

  it('should build correct index header', () => {
    const header = railsAdapter.buildIndexHeader('7.1.3', '.rails-docs/rails-7.1.3/guides/source')

    expect(header).toContain('[Rails 7.1.3 Docs]')
    expect(header).toContain('root:.rails-docs/rails-7.1.3/guides/source')
    expect(header).toContain('STOP. Rails knowledge may be outdated.')
    expect(header).toContain('npx agentdocs rails')
  })
})
