import { describe, it, expect } from 'vitest'
import type { SourceAdapter } from '../../src/types.js'

describe('SourceAdapter interface', () => {
  it('should define required properties', () => {
    const adapter: SourceAdapter = {
      name: 'test',
      markerPrefix: 'TEST',
      getTarballUrl: () => 'https://example.com/test.tar.gz',
      getDocsPath: (extractedDir) => `${extractedDir}/docs`,
      getOutputDir: () => '.test-docs',
      categorizeFiles: (files) => ({ uncategorized: files }),
      buildIndexHeader: () => '[Test Docs]',
    }
    expect(adapter.name).toBe('test')
    expect(adapter.markerPrefix).toBe('TEST')
    expect(adapter.getTarballUrl()).toBe('https://example.com/test.tar.gz')
    expect(adapter.getDocsPath('/tmp/extracted')).toBe('/tmp/extracted/docs')
    expect(adapter.getOutputDir()).toBe('.test-docs')
    expect(adapter.categorizeFiles(['a.md', 'b.md'])).toEqual({ uncategorized: ['a.md', 'b.md'] })
    expect(adapter.buildIndexHeader('1.0', '/path')).toBe('[Test Docs]')
  })
})
