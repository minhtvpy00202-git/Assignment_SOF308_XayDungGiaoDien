import { describe, it, expect } from 'vitest'
import { validateRequired, validateEmail, validateFormData } from '../validation'

describe('validateRequired', () => {
  it('should reject empty strings', () => {
    expect(validateRequired('')).toBe(false)
  })
  
  it('should reject whitespace-only strings', () => {
    expect(validateRequired('   ')).toBe(false)
    expect(validateRequired('\t')).toBe(false)
    expect(validateRequired('\n')).toBe(false)
    expect(validateRequired('  \t\n  ')).toBe(false)
  })
  
  it('should accept non-empty strings', () => {
    expect(validateRequired('hello')).toBe(true)
    expect(validateRequired('a')).toBe(true)
    expect(validateRequired('123')).toBe(true)
  })
  
  it('should accept strings with leading/trailing whitespace but non-empty content', () => {
    expect(validateRequired('  hello  ')).toBe(true)
    expect(validateRequired('\thello\n')).toBe(true)
  })
})

describe('validateEmail', () => {
  it('should identify valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('test.user@example.com')).toBe(true)
    expect(validateEmail('user+tag@example.co.uk')).toBe(true)
    expect(validateEmail('user123@test-domain.com')).toBe(true)
  })
  
  it('should identify invalid email addresses', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('notanemail')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('user@')).toBe(false)
    expect(validateEmail('user@.com')).toBe(false)
    expect(validateEmail('user @example.com')).toBe(false)
    expect(validateEmail('user@example')).toBe(false)
  })
  
  it('should reject emails with spaces', () => {
    expect(validateEmail('user name@example.com')).toBe(false)
    expect(validateEmail('user@exam ple.com')).toBe(false)
  })
  
  it('should reject emails without @ symbol', () => {
    expect(validateEmail('userexample.com')).toBe(false)
  })
  
  it('should reject emails without domain extension', () => {
    expect(validateEmail('user@example')).toBe(false)
  })
})

describe('validateFormData', () => {
  it('should return empty object for valid data', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello world'
    }
    const requiredFields = ['name', 'email', 'message']
    
    const errors = validateFormData(data, requiredFields)
    expect(Object.keys(errors).length).toBe(0)
  })
  
  it('should return errors for empty required fields', () => {
    const data = {
      name: '',
      email: 'john@example.com',
      message: 'Hello'
    }
    const requiredFields = ['name', 'email', 'message']
    
    const errors = validateFormData(data, requiredFields)
    expect(errors.name).toBeTruthy()
    expect(errors.email).toBeUndefined()
    expect(errors.message).toBeUndefined()
  })
  
  it('should return errors for whitespace-only fields', () => {
    const data = {
      name: '   ',
      email: '\t',
      message: 'Hello'
    }
    const requiredFields = ['name', 'email', 'message']
    
    const errors = validateFormData(data, requiredFields)
    expect(errors.name).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.message).toBeUndefined()
  })
  
  it('should return errors for missing fields', () => {
    const data = {
      name: 'John Doe'
    }
    const requiredFields = ['name', 'email', 'message']
    
    const errors = validateFormData(data, requiredFields)
    expect(errors.name).toBeUndefined()
    expect(errors.email).toBeTruthy()
    expect(errors.message).toBeTruthy()
  })
  
  it('should handle multiple validation errors', () => {
    const data = {
      name: '',
      email: '   ',
      message: ''
    }
    const requiredFields = ['name', 'email', 'message']
    
    const errors = validateFormData(data, requiredFields)
    expect(Object.keys(errors).length).toBe(3)
    expect(errors.name).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.message).toBeTruthy()
  })
})
