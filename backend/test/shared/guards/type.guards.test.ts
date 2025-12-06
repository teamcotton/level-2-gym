import { describe, expect, it } from 'vitest'

import {
  hasProperty,
  isArray,
  isBoolean,
  isDefined,
  isNullOrUndefined,
  isNumber,
  isObject,
  isString,
} from '../../../src/shared/guards/type.guards.js'

describe('Type Guards', () => {
  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('hello')).toBe(true)
      expect(isString('')).toBe(true)
      expect(isString('123')).toBe(true)
    })

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false)
      expect(isString(true)).toBe(false)
      expect(isString(null)).toBe(false)
      expect(isString(undefined)).toBe(false)
      expect(isString({})).toBe(false)
      expect(isString([])).toBe(false)
    })
  })

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(123)).toBe(true)
      expect(isNumber(0)).toBe(true)
      expect(isNumber(-456)).toBe(true)
      expect(isNumber(3.14)).toBe(true)
      expect(isNumber(Infinity)).toBe(true)
    })

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false)
    })

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false)
      expect(isNumber(true)).toBe(false)
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
      expect(isNumber({})).toBe(false)
      expect(isNumber([])).toBe(false)
    })
  })

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true)
      expect(isBoolean(false)).toBe(true)
    })

    it('should return false for non-booleans', () => {
      expect(isBoolean(1)).toBe(false)
      expect(isBoolean(0)).toBe(false)
      expect(isBoolean('true')).toBe(false)
      expect(isBoolean(null)).toBe(false)
      expect(isBoolean(undefined)).toBe(false)
      expect(isBoolean({})).toBe(false)
      expect(isBoolean([])).toBe(false)
    })
  })

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ key: 'value' })).toBe(true)
      expect(isObject(new Object())).toBe(true)
    })

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false)
      expect(isObject([1, 2, 3])).toBe(false)
    })

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(undefined)).toBe(false)
    })

    it('should return true for class instances', () => {
      class TestClass {}
      expect(isObject(new TestClass())).toBe(true)
    })
  })

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true)
      expect(isArray([1, 2, 3])).toBe(true)
      expect(isArray(['a', 'b'])).toBe(true)
      expect(isArray(new Array())).toBe(true)
    })

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false)
      expect(isArray('array')).toBe(false)
      expect(isArray(123)).toBe(false)
      expect(isArray(null)).toBe(false)
      expect(isArray(undefined)).toBe(false)
    })

    it('should work with typed arrays', () => {
      expect(isArray<string>(['a', 'b'])).toBe(true)
      expect(isArray<number>([1, 2, 3])).toBe(true)
    })
  })

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined('string')).toBe(true)
      expect(isDefined(123)).toBe(true)
      expect(isDefined(0)).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined('')).toBe(true)
      expect(isDefined({})).toBe(true)
      expect(isDefined([])).toBe(true)
    })

    it('should return false for null', () => {
      expect(isDefined(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isDefined(undefined)).toBe(false)
    })
  })

  describe('isNullOrUndefined', () => {
    it('should return true for null', () => {
      expect(isNullOrUndefined(null)).toBe(true)
    })

    it('should return true for undefined', () => {
      expect(isNullOrUndefined(undefined)).toBe(true)
    })

    it('should return false for defined values', () => {
      expect(isNullOrUndefined('string')).toBe(false)
      expect(isNullOrUndefined(123)).toBe(false)
      expect(isNullOrUndefined(0)).toBe(false)
      expect(isNullOrUndefined(false)).toBe(false)
      expect(isNullOrUndefined('')).toBe(false)
      expect(isNullOrUndefined({})).toBe(false)
      expect(isNullOrUndefined([])).toBe(false)
    })
  })

  describe('hasProperty', () => {
    it('should return true when object has the property', () => {
      expect(hasProperty({ name: 'John' }, 'name')).toBe(true)
      expect(hasProperty({ age: 30, city: 'NYC' }, 'age')).toBe(true)
    })

    it('should return false when object does not have the property', () => {
      expect(hasProperty({ name: 'John' }, 'age')).toBe(false)
      expect(hasProperty({}, 'key')).toBe(false)
    })

    it('should return false for non-objects', () => {
      expect(hasProperty(null, 'key')).toBe(false)
      expect(hasProperty(undefined, 'key')).toBe(false)
      expect(hasProperty('string', 'length')).toBe(false)
      expect(hasProperty(123, 'toString')).toBe(false)
      expect(hasProperty([], 'length')).toBe(false)
    })

    it('should check inherited properties', () => {
      class Parent {
        parentProp = 'parent'
      }
      class Child extends Parent {
        childProp = 'child'
      }
      const instance = new Child()
      expect(hasProperty(instance, 'childProp')).toBe(true)
      expect(hasProperty(instance, 'parentProp')).toBe(true)
    })
  })
})
