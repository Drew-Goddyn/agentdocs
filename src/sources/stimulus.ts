import type { SourceAdapter } from '../types.js'
import { categorizeByDirectory } from './shared.js'

export const stimulusAdapter: SourceAdapter = {
  name: 'stimulus',
  markerPrefix: 'STIMULUS-AGENTS-MD',

  getTarballUrl: () =>
    'https://github.com/hotwired/stimulus-site/archive/refs/heads/main.tar.gz',

  getDocsPath: (extractedDir) =>
    `${extractedDir}/_source`,

  getOutputDir: () => '.stimulus-docs',

  categorizeFiles: categorizeByDirectory,

  buildIndexHeader: (_version, docsPath) =>
    `[Stimulus Docs]|root:${docsPath}|Refresh: npx agents-md stimulus`,
}
