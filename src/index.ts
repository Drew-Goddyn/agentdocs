export { BadInputError, FetchError, ParseError } from './errors.js'
export { parseRailsVersion, versionToTarballUrl, findGemfileLock } from './version-detector.js'
export { downloadAndExtract, collectMdFiles } from './tarball-fetcher.js'
export type { FetchResult } from './tarball-fetcher.js'
export { buildCompactIndex, categorizeFiles } from './index-builder.js'
export { injectIndex, findTargetFile, MARKERS } from './file-injector.js'
export { updateGitignore } from './gitignore-updater.js'
export { promptVersion, promptConfirm, promptOutputFile } from './prompts.js'
export type {
  RailsVersionResult,
  FetchOptions,
  IndexOptions,
  InjectOptions,
  CLIOptions,
} from './types.js'
