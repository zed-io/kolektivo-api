import { getValoraVersionFromUserAgent } from '../src/utils'

describe('getValoraVersionFromUserAgent', () => {
  it.each`
    userAgent                                | expectedVersion
    ${'Valora/1.49.0 (iOS 14.5; iPhone)'}    | ${'1.49.0'}
    ${'Valora/1.49.0 (Android 12; Pixel 5)'} | ${'1.49.0'}
    ${'Valora/1.0.0-dev'}                    | ${'1.0.0-dev'}
    ${'Something Valora/1.0.0'}              | ${'1.0.0'}
    ${'Valora'}                              | ${undefined}
    ${''}                                    | ${undefined}
  `(
    'returns $expectedVersion when User-Agent is "$userAgent"',
    ({ userAgent, expectedVersion }) => {
      expect(getValoraVersionFromUserAgent(userAgent)).toBe(expectedVersion)
    },
  )
})
