import * as fs from 'node:fs'
import * as path from 'node:path'

const GITIGNORE_ENTRY = '.rails-docs/'

export function updateGitignore(projectDir: string): void {
  const gitignorePath = path.join(projectDir, '.gitignore')

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, GITIGNORE_ENTRY + '\n')
    return
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8')

  if (content.includes(GITIGNORE_ENTRY)) {
    return
  }

  const newContent = content.trimEnd() + '\n' + GITIGNORE_ENTRY + '\n'
  fs.writeFileSync(gitignorePath, newContent)
}
