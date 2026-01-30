export interface SourceAdapter {
  name: string
  markerPrefix: string
  getTarballUrl: (version?: string) => string
  getDocsPath: (extractedDir: string) => string
  getOutputDir: (version?: string) => string
  categorizeFiles: (fileNames: string[]) => Record<string, string[]>
  buildIndexHeader: (version: string, docsPath: string) => string
}

export type RailsVersionResult =
  | { type: 'version'; version: string }
  | { type: 'git'; ref: string | null }

export interface FetchOptions {
  version: string
  force?: boolean
  outputDir?: string
}

export interface IndexOptions {
  files: string[]
  version: string
  docsPath: string
}

export interface InjectOptions {
  targetFile: string
  index: string
}

export interface CLIOptions {
  output?: string
  railsVersion?: string
  yes?: boolean
  force?: boolean
}
