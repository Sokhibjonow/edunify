export const CONNECT_CODE_PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/

const CONNECT_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// Deterministic seed — stable across page reloads for mock data.
let _codeSeed = 0x2f6e2b1

/** Generates a Connect Code in XXX-XXX-XXX format (uppercase A–Z and digits). */
export function generateConnectCode(): string {
  const seg = () =>
    Array.from({ length: 3 }, () => {
      _codeSeed = (_codeSeed * 1103515245 + 12345) & 0x7fffffff
      return CONNECT_CODE_CHARS[_codeSeed % CONNECT_CODE_CHARS.length]
    }).join('')
  return `${seg()}-${seg()}-${seg()}`
}

export function isConnectCode(value: string): boolean {
  return CONNECT_CODE_PATTERN.test(value)
}

/** Normalizes free typing ("k7m2qx9dp", "k7m 2qx-9dp") into XXX-XXX-XXX as the user types. */
export function formatConnectCodeInput(raw: string): string {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9)
  return chars.match(/.{1,3}/g)?.join('-') ?? ''
}
