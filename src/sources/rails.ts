import type { SourceAdapter } from '../types.js'

export const railsAdapter: SourceAdapter = {
  name: 'rails',
  markerPrefix: 'RAILS-AGENTS-MD',

  getTarballUrl: (_version) =>
    `https://github.com/rails/rails.git`,

  getDocsPath: (extractedDir) => extractedDir,

  getOutputDir: (version) => `.rails-docs/${version || 'main'}`,

  categorizeFiles: (fileNames) => {
    const categories: Record<string, string[]> = {}

    for (const fileName of fileNames) {
      const parts = fileName.replace('.md', '').split('/')
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.'
      const file = parts[parts.length - 1]

      categories[dir] ??= []
      categories[dir].push(file)
    }

    return categories
  },

  buildIndexHeader: (version, docsPath) =>
    `[Rails ${version} Guides]|root:${docsPath}|STOP. Rails knowledge outdated. Read docs first.|Refresh: npx agentdocs rails`,
}
