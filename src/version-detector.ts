import * as fs from 'node:fs'
import * as path from 'node:path'
import { BadInputError } from './errors.js'
import type { RailsVersionResult } from './types.js'

export function parseRailsVersion(content: string): RailsVersionResult {
  const gitBlockMatch = content.match(/^GIT\n\s+remote:\s+(https:\/\/github\.com\/rails\/rails(?:\.git)?)\n\s+revision:\s+\S+\n(?:\s+branch:\s+(\S+)\n)?/m)

  if (gitBlockMatch) {
    const branch = gitBlockMatch[2] || null
    return { type: 'git', ref: branch }
  }

  const railsPattern = /^\s+rails\s+\(([^)]+)\)/m
  const match = content.match(railsPattern)

  if (!match) {
    throw new BadInputError('Rails gem not found in Gemfile.lock')
  }

  return { type: 'version', version: match[1] }
}

export function versionToTarballUrl(version: string): string {
  return `https://github.com/rails/rails/archive/refs/tags/v${version}.tar.gz`
}

export function findGemfileLock(startDir: string): string | null {
  let currentDir = startDir

  while (true) {
    const gemfilePath = path.join(currentDir, 'Gemfile.lock')
    if (fs.existsSync(gemfilePath)) {
      return gemfilePath
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      return null
    }
    currentDir = parentDir
  }
}
