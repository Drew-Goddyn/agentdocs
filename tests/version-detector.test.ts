import { describe, it, expect } from 'vitest'
import { parseRailsVersion, versionToTarballUrl } from '../src/version-detector.js'
import { BadInputError } from '../src/errors.js'

describe('parseRailsVersion', () => {
  it('should parse standard version from GEM section', () => {
    const content = `
GEM
  remote: https://rubygems.org/
  specs:
    actioncable (7.1.3)
    actionmailbox (7.1.3)
    rails (7.1.3)
      actioncable (= 7.1.3)
      actionmailbox (= 7.1.3)
    rack (3.0.8)

PLATFORMS
  ruby
`
    const result = parseRailsVersion(content)
    expect(result).toEqual({ type: 'version', version: '7.1.3' })
  })

  it('should parse prerelease version', () => {
    const content = `
GEM
  remote: https://rubygems.org/
  specs:
    rails (8.0.0.beta1)
      actioncable (= 8.0.0.beta1)
`
    const result = parseRailsVersion(content)
    expect(result).toEqual({ type: 'version', version: '8.0.0.beta1' })
  })

  it('should detect git source with branch', () => {
    const content = `
GIT
  remote: https://github.com/rails/rails.git
  revision: abc123def456
  branch: main
  specs:
    actioncable (8.0.0.alpha)
    rails (8.0.0.alpha)
      actioncable (= 8.0.0.alpha)

GEM
  remote: https://rubygems.org/
  specs:
    rack (3.0.8)
`
    const result = parseRailsVersion(content)
    expect(result).toEqual({ type: 'git', ref: 'main' })
  })

  it('should detect git source without branch', () => {
    const content = `
GIT
  remote: https://github.com/rails/rails.git
  revision: abc123def456
  specs:
    rails (8.0.0.alpha)
      actioncable (= 8.0.0.alpha)

GEM
  remote: https://rubygems.org/
  specs:
    rack (3.0.8)
`
    const result = parseRailsVersion(content)
    expect(result).toEqual({ type: 'git', ref: null })
  })

  it('should throw BadInputError when rails gem not found', () => {
    const content = `
GEM
  remote: https://rubygems.org/
  specs:
    rack (3.0.8)
    sinatra (3.0.0)
`
    expect(() => parseRailsVersion(content)).toThrow(BadInputError)
    expect(() => parseRailsVersion(content)).toThrow('Rails gem not found in Gemfile.lock')
  })

  it('should parse version with four segments', () => {
    const content = `
GEM
  specs:
    rails (7.0.8.7)
`
    const result = parseRailsVersion(content)
    expect(result).toEqual({ type: 'version', version: '7.0.8.7' })
  })
})

describe('versionToTarballUrl', () => {
  it('should generate correct tarball URL', () => {
    const url = versionToTarballUrl('7.1.3')
    expect(url).toBe('https://github.com/rails/rails/archive/refs/tags/v7.1.3.tar.gz')
  })

  it('should handle prerelease versions', () => {
    const url = versionToTarballUrl('8.0.0.beta1')
    expect(url).toBe('https://github.com/rails/rails/archive/refs/tags/v8.0.0.beta1.tar.gz')
  })
})
