import { author as _author, name } from '~/package.json'
import type { ApiUser } from './types'

const author = _author.name ?? _author
const authorInKebabCase = author.replace(/\s+/g, '-')
const appId = `com.${authorInKebabCase}.${name}`.toLowerCase()

export function makeAppId(id: string = appId): string {
  return id
}

export function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function canManageFaults(user: ApiUser): boolean {
  return user.is_admin || user.is_service
}
