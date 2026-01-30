import { describe, it, expect } from 'vitest'
import { buildCompactIndex, categorizeFiles } from '../src/index-builder.js'

describe('categorizeFiles', () => {
  it('should group files by prefix', () => {
    const files = [
      'active_record_basics.md',
      'active_record_callbacks.md',
      'active_record_migrations.md',
      'action_controller_overview.md',
      'action_controller_filters.md',
      'getting_started.md',
      'routing.md',
    ]

    const categories = categorizeFiles(files)

    expect(categories['active_record']).toEqual(['basics', 'callbacks', 'migrations'])
    expect(categories['action_controller']).toEqual(['overview', 'filters'])
    expect(categories['_uncategorized']).toContain('getting_started')
    expect(categories['_uncategorized']).toContain('routing')
  })

  it('should handle empty input', () => {
    const categories = categorizeFiles([])
    expect(Object.keys(categories)).toHaveLength(0)
  })
})

describe('buildCompactIndex', () => {
  it('should build pipe-delimited index with metadata', () => {
    const files = [
      '/path/to/docs/active_record_basics.md',
      '/path/to/docs/active_record_callbacks.md',
      '/path/to/docs/getting_started.md',
    ]

    const index = buildCompactIndex({
      files,
      version: '7.1.3',
      docsPath: '.rails-docs/rails-7.1.3/guides/source',
    })

    expect(index).toContain('[Rails 7.1.3 Docs]')
    expect(index).toContain('root:.rails-docs/rails-7.1.3/guides/source')
    expect(index).toContain('STOP. Rails knowledge may be outdated. Search docs first.')
    expect(index).toContain('Refresh: npx rails-agents-md')
    expect(index).toContain('active_record:{basics,callbacks}')
    expect(index).toContain('getting_started')
  })

  it('should handle multiple categories', () => {
    const files = [
      '/docs/active_record_basics.md',
      '/docs/action_controller_overview.md',
      '/docs/action_mailer_basics.md',
    ]

    const index = buildCompactIndex({
      files,
      version: '8.0.0',
      docsPath: '.rails-docs/rails-8.0.0/guides/source',
    })

    expect(index).toContain('active_record:{basics}')
    expect(index).toContain('action_controller:{overview}')
    expect(index).toContain('action_mailer:{basics}')
  })
})
