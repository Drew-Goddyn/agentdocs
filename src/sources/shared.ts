export function categorizeByDirectory(fileNames: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {}

  for (const fileName of fileNames) {
    const parts = fileName.split('/')
    const category = parts.length > 1 ? parts[0] : '_root'
    const name = parts[parts.length - 1]
      .replace('.md', '')
      .replace(/^\d+_/, '')
    categories[category] ??= []
    categories[category].push(name)
  }

  return categories
}
