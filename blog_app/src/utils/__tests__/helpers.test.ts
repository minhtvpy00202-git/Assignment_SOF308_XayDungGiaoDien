import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateId, formatDate, formatRelativeTime } from '../helpers'

describe('generateId', () => {
  it('should produce unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    const id3 = generateId()
    
    expect(id1).not.toBe(id2)
    expect(id2).not.toBe(id3)
    expect(id1).not.toBe(id3)
  })
  
  it('should return a string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })
  
  it('should return non-empty string', () => {
    const id = generateId()
    expect(id.length).toBeGreaterThan(0)
  })
  
  it('should contain a hyphen separator', () => {
    const id = generateId()
    expect(id).toContain('-')
  })
})

describe('formatDate', () => {
  it('should correctly format ISO timestamps', () => {
    const timestamp = '2024-01-15T15:45:00.000Z'
    const formatted = formatDate(timestamp)
    
    // Should contain month, day, year, and time
    expect(formatted).toMatch(/Jan/)
    expect(formatted).toMatch(/15/)
    expect(formatted).toMatch(/2024/)
    expect(formatted).toMatch(/at/)
  })
  
  it('should handle different months', () => {
    const timestamps = [
      '2024-01-01T12:00:00.000Z',
      '2024-06-15T12:00:00.000Z',
      '2024-12-31T12:00:00.000Z'
    ]
    
    timestamps.forEach(timestamp => {
      const formatted = formatDate(timestamp)
      expect(formatted).toBeTruthy()
      expect(formatted).toMatch(/\d{4}/)
    })
  })
  
  it('should include time with AM/PM', () => {
    const timestamp = '2024-01-15T15:45:00.000Z'
    const formatted = formatDate(timestamp)
    
    expect(formatted).toMatch(/AM|PM/)
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed time
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })
  
  it('should return "just now" for recent timestamps', () => {
    const timestamp = new Date('2024-01-15T11:59:30.000Z').toISOString()
    expect(formatRelativeTime(timestamp)).toBe('just now')
  })
  
  it('should return minutes ago for timestamps within an hour', () => {
    const timestamp = new Date('2024-01-15T11:45:00.000Z').toISOString()
    const result = formatRelativeTime(timestamp)
    expect(result).toMatch(/\d+ minutes? ago/)
  })
  
  it('should return hours ago for timestamps within a day', () => {
    const timestamp = new Date('2024-01-15T09:00:00.000Z').toISOString()
    const result = formatRelativeTime(timestamp)
    expect(result).toMatch(/\d+ hours? ago/)
  })
  
  it('should return days ago for timestamps within a week', () => {
    const timestamp = new Date('2024-01-13T12:00:00.000Z').toISOString()
    const result = formatRelativeTime(timestamp)
    expect(result).toMatch(/\d+ days? ago/)
  })
  
  it('should return weeks ago for timestamps within a month', () => {
    const timestamp = new Date('2024-01-01T12:00:00.000Z').toISOString()
    const result = formatRelativeTime(timestamp)
    expect(result).toMatch(/\d+ weeks? ago/)
  })
  
  it('should return months ago for timestamps within a year', () => {
    const timestamp = new Date('2023-10-15T12:00:00.000Z').toISOString()
    const result = formatRelativeTime(timestamp)
    expect(result).toMatch(/\d+ months? ago/)
  })
  
  it('should return years ago for old timestamps', () => {
    const timestamp = new Date('2022-01-15T12:00:00.000Z').toISOString()
    const result = formatRelativeTime(timestamp)
    expect(result).toMatch(/\d+ years? ago/)
  })
})
