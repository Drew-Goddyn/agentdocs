import type { SourceAdapter } from '../types.js'
import { categorizeByDirectory } from './shared.js'

export const stimulusAdapter: SourceAdapter = {
  name: 'stimulus',
  markerPrefix: 'STIMULUS-AGENTS-MD',

  getTarballUrl: () => 'https://github.com/hotwired/stimulus.git',

  getDocsPath: (extractedDir) => extractedDir,

  getOutputDir: () => '.stimulus-docs',

  categorizeFiles: categorizeByDirectory,

  buildIndexHeader: (_version, docsPath) =>
    `[Stimulus Docs]|root:${docsPath}|Refresh: npx agentdocs stimulus`,
}
