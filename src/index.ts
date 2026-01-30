export { BadInputError, FetchError, ParseError } from './errors.js'
export { parseRailsVersion, versionToTarballUrl, findGemfileLock } from './version-detector.js'
export { downloadAndExtract, collectMdFiles } from './core/tarball-fetcher.js'
export type { FetchResult } from './core/tarball-fetcher.js'
export { buildCompactIndex, categorizeFiles, buildIndexWithAdapter } from './core/index-builder.js'
export { injectIndex, injectIndexWithMarkers, findTargetFile, getMarkers } from './core/file-injector.js'
export { updateGitignore } from './core/gitignore-updater.js'
export { promptVersion, promptConfirm, promptOutputFile } from './core/prompts.js'
export { railsAdapter } from './sources/rails.js'
export { turboAdapter } from './sources/turbo.js'
export { stimulusAdapter } from './sources/stimulus.js'
export { categorizeByDirectory } from './sources/shared.js'
export { runSource } from './runner.js'
export type { RunnerOptions } from './runner.js'
export type {
  SourceAdapter,
  RailsVersionResult,
  FetchOptions,
  IndexOptions,
  InjectOptions,
  CLIOptions,
} from './types.js'
