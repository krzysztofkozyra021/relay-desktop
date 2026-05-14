import { author as _author, name } from '~/package.json'

const author = _author.name ?? _author
const authorInKebabCase = author.replace(/\s+/g, '-')
const appId = `com.${authorInKebabCase}.${name}`.toLowerCase()


export function makeAppId(id: string = appId): string {
  return id
}


export function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
