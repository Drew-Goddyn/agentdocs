import type { SourceAdapter } from '../types.js'
import { categorizeByDirectory } from './shared.js'

export function isSubstantialMarkdown(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed) return false

  const frontmatterMatch = trimmed.match(/^---\n[\s\S]*?\n---\n?/)
  if (frontmatterMatch) {
    const afterFrontmatter = trimmed.slice(frontmatterMatch[0].length).trim()
    return afterFrontmatter.length > 0
  }

  return true
}

export const alpineAdapter: SourceAdapter = {
  name: 'alpine',
  markerPrefix: 'ALPINE-AGENTS-MD',

  getTarballUrl: () => 'https://github.com/alpinejs/alpine.git',

  getDocsPath: (extractedDir) => extractedDir,

  getOutputDir: () => '.alpine-docs',

  categorizeFiles: categorizeByDirectory,

  buildIndexHeader: (_version, docsPath) =>
    `[Alpine.js Docs]|root:${docsPath}|Refresh: npx agentdocs alpine`,
}
