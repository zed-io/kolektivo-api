import fetch from 'cross-fetch'

export async function fetchWithTimeout(
  url: string,
  duration: number,
  body?: RequestInit,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, duration)

  const requestInit = {
    ...body,
    signal: controller.signal,
  }

  try {
    const response = await fetch(url, requestInit)
    return response
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}
