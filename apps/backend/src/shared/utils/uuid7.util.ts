import { uuidv7 } from 'uuidv7'
import { isValidUUID, uuidVersionValidation } from 'uuidv7-utilities'

export class Uuid7Util {
  static uuidVersionValidation(uuid: string): string | undefined {
    return uuidVersionValidation(uuid)
  }

  static isValidUUID(uuid: string): boolean {
    return isValidUUID(uuid)
  }

  createUuidv7(): string {
    return uuidv7()
  }
}
