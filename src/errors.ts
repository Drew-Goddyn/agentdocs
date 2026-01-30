export class BadInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadInputError'
  }
}

export class FetchError extends Error {
  statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'FetchError'
    this.statusCode = statusCode
  }
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}
