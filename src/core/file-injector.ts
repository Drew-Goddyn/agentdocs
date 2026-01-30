import * as fs from 'node:fs'
import * as path from 'node:path'
import type { InjectOptions } from '../types.js'

export function getMarkers(prefix: string) {
  return {
    START: `<!-- ${prefix}-START -->`,
    END: `<!-- ${prefix}-END -->`,
  }
}

export const MARKERS = getMarkers('RAILS-AGENTS-MD')

export function injectIndex(options: InjectOptions): void {
  injectIndexWithMarkers({ ...options, markerPrefix: 'RAILS-AGENTS-MD' })
}

export function injectIndexWithMarkers(options: InjectOptions & { markerPrefix: string }): void {
  const { targetFile, index, markerPrefix } = options
  const markers = getMarkers(markerPrefix)

  const wrappedIndex = `${markers.START}
${index}
${markers.END}`

  if (!fs.existsSync(targetFile)) {
    fs.mkdirSync(path.dirname(targetFile), { recursive: true })
    fs.writeFileSync(targetFile, wrappedIndex + '\n')
    return
  }

  const content = fs.readFileSync(targetFile, 'utf-8')

  const markerPattern = new RegExp(
    `${escapeRegex(markers.START)}[\\s\\S]*?${escapeRegex(markers.END)}`
  )

  if (markerPattern.test(content)) {
    const newContent = content.replace(markerPattern, wrappedIndex)
    fs.writeFileSync(targetFile, newContent)
  } else {
    const newContent = content.trimEnd() + '\n\n' + wrappedIndex + '\n'
    fs.writeFileSync(targetFile, newContent)
  }
}

export function findTargetFile(startDir: string): string {
  const claudeMd = path.join(startDir, 'CLAUDE.md')
  const agentsMd = path.join(startDir, 'AGENTS.md')

  if (fs.existsSync(claudeMd)) {
    return claudeMd
  }

  if (fs.existsSync(agentsMd)) {
    return agentsMd
  }

  return claudeMd
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
