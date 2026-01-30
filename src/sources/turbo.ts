import type { SourceAdapter } from '../types.js'
import { categorizeByDirectory } from './shared.js'

export const turboAdapter: SourceAdapter = {
  name: 'turbo',
  markerPrefix: 'TURBO-AGENTS-MD',

  getTarballUrl: () =>
    'https://github.com/hotwired/turbo-site/archive/refs/heads/main.tar.gz',

  getDocsPath: (extractedDir) =>
    `${extractedDir}/_source`,

  getOutputDir: () => '.turbo-docs',

  categorizeFiles: categorizeByDirectory,

  buildIndexHeader: (_version, docsPath) =>
    `[Turbo Docs]|root:${docsPath}|Refresh: npx agentdocs turbo`,
}
