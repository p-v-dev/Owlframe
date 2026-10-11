import { describe, expect, it } from 'vitest'
import { APP_ID, APP_NAME } from './app-info'

describe('app identity', () => {
  it('defines Owlframe metadata', () => {
    expect(APP_NAME).toBe('Owlframe')
    expect(APP_ID).toBe('io.owlframe.app')
  })
})
