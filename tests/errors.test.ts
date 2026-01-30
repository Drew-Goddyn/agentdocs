import { describe, it, expect } from 'vitest'
import { BadInputError, FetchError, ParseError } from '../src/errors.js'

describe('BadInputError', () => {
  it('should have name BadInputError', () => {
    const error = new BadInputError('test message')
    expect(error.name).toBe('BadInputError')
  })

  it('should store message', () => {
    const error = new BadInputError('No Gemfile.lock found')
    expect(error.message).toBe('No Gemfile.lock found')
  })

  it('should be instanceof Error', () => {
    const error = new BadInputError('test')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('FetchError', () => {
  it('should have name FetchError', () => {
    const error = new FetchError('Network error')
    expect(error.name).toBe('FetchError')
  })

  it('should store status code when provided', () => {
    const error = new FetchError('Not found', 404)
    expect(error.statusCode).toBe(404)
  })

  it('should have undefined status code when not provided', () => {
    const error = new FetchError('Network error')
    expect(error.statusCode).toBeUndefined()
  })
})

describe('ParseError', () => {
  it('should have name ParseError', () => {
    const error = new ParseError('Invalid format')
    expect(error.name).toBe('ParseError')
  })

  it('should store message', () => {
    const error = new ParseError('Could not parse Gemfile.lock')
    expect(error.message).toBe('Could not parse Gemfile.lock')
  })
})
