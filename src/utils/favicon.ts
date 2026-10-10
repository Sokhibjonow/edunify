export const DEFAULT_FAVICON = '/favicon'

export function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  const resolved = new URL(href, window.location.origin).href
  if (link.href !== resolved) {
    link.href = href
  }
}
