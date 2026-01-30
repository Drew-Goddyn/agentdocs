import * as fs from 'node:fs'
import * as path from 'node:path'
import type { InjectOptions } from './types.js'

export const MARKERS = {
  START: '<!-- RAILS-AGENTS-MD-START -->',
  END: '<!-- RAILS-AGENTS-MD-END -->',
}

export function injectIndex(options: InjectOptions): void {
  const { targetFile, index } = options

  const wrappedIndex = `${MARKERS.START}
${index}
${MARKERS.END}`

  if (!fs.existsSync(targetFile)) {
    fs.mkdirSync(path.dirname(targetFile), { recursive: true })
    fs.writeFileSync(targetFile, wrappedIndex + '\n')
    return
  }

  const content = fs.readFileSync(targetFile, 'utf-8')

  const markerPattern = new RegExp(
    `${escapeRegex(MARKERS.START)}[\\s\\S]*?${escapeRegex(MARKERS.END)}`
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
