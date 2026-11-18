const REVOKE_DELAY = 1000

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()

  // Give the browser a moment to start the download before dropping the URL.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, REVOKE_DELAY)
}
