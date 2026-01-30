import * as path from 'node:path'
import type { SourceAdapter, IndexOptions } from '../types.js'

const KNOWN_PREFIXES = [
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

export function categorizeFiles(fileNames: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {}

  for (const fileName of fileNames) {
    const baseName = path.basename(fileName, '.md')
    let matched = false

    for (const prefix of KNOWN_PREFIXES) {
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
}

export function buildCompactIndex(options: IndexOptions): string {
  const { files, version, docsPath } = options

  const fileNames = files.map(f => path.basename(f))
  const categories = categorizeFiles(fileNames)

  const parts: string[] = [
    `[Rails ${version} Docs]`,
    `root:${docsPath}`,
    'STOP. Rails knowledge may be outdated. Search docs first.',
    'Refresh: npx agents-md rails',
  ]

  for (const [prefix, suffixes] of Object.entries(categories)) {
    if (prefix === '_uncategorized') {
      parts.push(...suffixes)
    } else {
      parts.push(`${prefix}:{${suffixes.join(',')}}`)
    }
  }

  return parts.join('|')
}

export function buildIndexWithAdapter(
  adapter: SourceAdapter,
  files: string[],
  version: string,
  docsPath: string
): string {
  const fileNames = files.map(f => path.basename(f))
  const categories = adapter.categorizeFiles(fileNames)

  const parts: string[] = [adapter.buildIndexHeader(version, docsPath)]

  for (const [prefix, suffixes] of Object.entries(categories)) {
    if (prefix === '_uncategorized' || prefix === '_root') {
      parts.push(...suffixes)
    } else {
      parts.push(`${prefix}:{${suffixes.join(',')}}`)
    }
  }

  return parts.join('|')
}
