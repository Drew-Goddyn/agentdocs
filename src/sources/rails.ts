import type { SourceAdapter } from '../types.js'

const RAILS_PREFIXES = [
  'active_record',
  'active_model',
  'active_job',
  'active_storage',
  'active_support',
  'action_controller',
  'action_view',
  'action_mailer',
  'action_cable',
  'action_text',
  'action_mailbox',
]

export const railsAdapter: SourceAdapter = {
  name: 'rails',
  markerPrefix: 'RAILS-AGENTS-MD',

  getTarballUrl: (version) =>
    `https://github.com/rails/rails/archive/refs/tags/v${version}.tar.gz`,

  getDocsPath: (extractedDir) =>
    `${extractedDir}/guides/source`,

  getOutputDir: (version) =>
    `.rails-docs/rails-${version}`,

  categorizeFiles: (fileNames) => {
    const categories: Record<string, string[]> = {}

    for (const fileName of fileNames) {
      const baseName = fileName.replace('.md', '')
      let matched = false

      for (const prefix of RAILS_PREFIXES) {
        if (baseName.startsWith(`${prefix}_`)) {
          const suffix = baseName.slice(prefix.length + 1)
          categories[prefix] ??= []
          categories[prefix].push(suffix)
          matched = true
          break
        }
      }

      if (!matched) {
        categories['_uncategorized'] ??= []
        categories['_uncategorized'].push(baseName)
      }
    }

    return categories
  },

  buildIndexHeader: (version, docsPath) =>
    `[Rails ${version} Docs]|root:${docsPath}|STOP. Rails knowledge may be outdated. Search docs first.|Refresh: npx agents-md rails`,
}
