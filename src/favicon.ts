import faviconUrl from './assets/Griziplogo.png'

const setFavicon = () => {
  const link = document.querySelector('link[rel="icon"]') || document.createElement('link')
  link.setAttribute('rel', 'icon')
  link.setAttribute('href', faviconUrl)
  link.setAttribute('type', 'image/png')
  document.head.appendChild(link)
}

export default setFavicon
