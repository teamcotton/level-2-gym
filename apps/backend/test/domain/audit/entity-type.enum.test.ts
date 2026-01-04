import { describe, expect, it } from 'vitest'

import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'

describe('EntityType Enum', () => {
  describe('Constant Values', () => {
    it('should have USER constant', () => {
      expect(EntityType.USER).toBe('user')
    })

    it('should have CHAT constant', () => {
      expect(EntityType.CHAT).toBe('chat')
    })

    it('should have MESSAGE constant', () => {
      expect(EntityType.MESSAGE).toBe('message')
    })

    it('should have PART constant', () => {
      expect(EntityType.PART).toBe('part')
    })

    it('should have AI_OPTIONS constant', () => {
      expect(EntityType.AI_OPTIONS).toBe('ai_options')
    })
  })

  describe('Type Safety', () => {
    it('should allow assignment of valid entity type strings', () => {
      const userType: EntityType = EntityType.USER
      const chatType: EntityType = EntityType.CHAT
      const messageType: EntityType = EntityType.MESSAGE
      const partType: EntityType = EntityType.PART
      const aiOptionsType: EntityType = EntityType.AI_OPTIONS

      expect(userType).toBe('user')
      expect(chatType).toBe('chat')
      expect(messageType).toBe('message')
      expect(partType).toBe('part')
      expect(aiOptionsType).toBe('ai_options')
    })

    it('should allow comparison between enum values', () => {
      expect(EntityType.USER).toBe(EntityType.USER)
      expect(EntityType.CHAT).not.toBe(EntityType.USER)
      expect(EntityType.MESSAGE).not.toBe(EntityType.PART)
    })

    it('should be immutable', () => {
      const entityTypeKeys = Object.keys(EntityType)
      expect(entityTypeKeys).toContain('USER')
      expect(entityTypeKeys).toContain('CHAT')
      expect(entityTypeKeys).toContain('MESSAGE')
      expect(entityTypeKeys).toContain('PART')
      expect(entityTypeKeys).toContain('AI_OPTIONS')
    })
  })

  describe('String Representation', () => {
    it('should convert to lowercase snake_case for database storage', () => {
      expect(EntityType.AI_OPTIONS).toBe('ai_options')
      expect(EntityType.AI_OPTIONS).not.toBe('AI_OPTIONS')
      expect(EntityType.AI_OPTIONS).not.toBe('aiOptions')
    })

    it('should use simple lowercase for single-word types', () => {
      expect(EntityType.USER).toBe('user')
      expect(EntityType.CHAT).toBe('chat')
      expect(EntityType.MESSAGE).toBe('message')
      expect(EntityType.PART).toBe('part')
    })
  })

  describe('Usage in Functions', () => {
    it('should work as function parameter', () => {
      function getEntityLabel(type: EntityType): string {
        const labels: Record<EntityType, string> = {
          [EntityType.USER]: 'User',
          [EntityType.CHAT]: 'Chat',
          [EntityType.MESSAGE]: 'Message',
          [EntityType.PART]: 'Part',
          [EntityType.AI_OPTIONS]: 'AI Options',
        }
        return labels[type]
      }

      expect(getEntityLabel(EntityType.USER)).toBe('User')
      expect(getEntityLabel(EntityType.CHAT)).toBe('Chat')
      expect(getEntityLabel(EntityType.MESSAGE)).toBe('Message')
      expect(getEntityLabel(EntityType.PART)).toBe('Part')
      expect(getEntityLabel(EntityType.AI_OPTIONS)).toBe('AI Options')
    })

    it('should work in switch statements', () => {
      function getTableName(type: EntityType): string {
        switch (type) {
          case EntityType.USER:
            return 'users'
          case EntityType.CHAT:
            return 'chats'
          case EntityType.MESSAGE:
            return 'messages'
          case EntityType.PART:
            return 'parts'
          case EntityType.AI_OPTIONS:
            return 'ai_options'
          default:
            return 'unknown'
        }
      }

      expect(getTableName(EntityType.USER)).toBe('users')
      expect(getTableName(EntityType.CHAT)).toBe('chats')
      expect(getTableName(EntityType.MESSAGE)).toBe('messages')
      expect(getTableName(EntityType.PART)).toBe('parts')
      expect(getTableName(EntityType.AI_OPTIONS)).toBe('ai_options')
    })
  })

  describe('Iteration', () => {
    it('should be iterable via Object.values', () => {
      const values = Object.values(EntityType)
      expect(values).toContain('user')
      expect(values).toContain('chat')
      expect(values).toContain('message')
      expect(values).toContain('part')
      expect(values).toContain('ai_options')
      expect(values).toHaveLength(5)
    })

    it('should allow iteration for validation', () => {
      const validEntityTypes = Object.values(EntityType)

      expect(validEntityTypes.includes('user')).toBe(true)
      expect(validEntityTypes.includes('chat')).toBe(true)
      expect(validEntityTypes.includes('invalid' as EntityType)).toBe(false)
    })
  })
})

describe('AuditAction Enum', () => {
  describe('Constant Values', () => {
    it('should have CREATE constant', () => {
      expect(AuditAction.CREATE).toBe('create')
    })

    it('should have UPDATE constant', () => {
      expect(AuditAction.UPDATE).toBe('update')
    })

    it('should have DELETE constant', () => {
      expect(AuditAction.DELETE).toBe('delete')
    })

    it('should have LOGIN constant', () => {
      expect(AuditAction.LOGIN).toBe('login')
    })

    it('should have LOGOUT constant', () => {
      expect(AuditAction.LOGOUT).toBe('logout')
    })

    it('should have LOGIN_FAILED constant', () => {
      expect(AuditAction.LOGIN_FAILED).toBe('login_failed')
    })

    it('should have PASSWORD_CHANGE constant', () => {
      expect(AuditAction.PASSWORD_CHANGE).toBe('password_change')
    })

    it('should have EMAIL_CHANGE constant', () => {
      expect(AuditAction.EMAIL_CHANGE).toBe('email_change')
    })
  })

  describe('Type Safety', () => {
    it('should allow assignment of valid action strings', () => {
      const createAction: AuditAction = AuditAction.CREATE
      const updateAction: AuditAction = AuditAction.UPDATE
      const deleteAction: AuditAction = AuditAction.DELETE
      const loginAction: AuditAction = AuditAction.LOGIN
      const logoutAction: AuditAction = AuditAction.LOGOUT
      const loginFailedAction: AuditAction = AuditAction.LOGIN_FAILED
      const passwordChangeAction: AuditAction = AuditAction.PASSWORD_CHANGE
      const emailChangeAction: AuditAction = AuditAction.EMAIL_CHANGE

      expect(createAction).toBe('create')
      expect(updateAction).toBe('update')
      expect(deleteAction).toBe('delete')
      expect(loginAction).toBe('login')
      expect(logoutAction).toBe('logout')
      expect(loginFailedAction).toBe('login_failed')
      expect(passwordChangeAction).toBe('password_change')
      expect(emailChangeAction).toBe('email_change')
    })

    it('should allow comparison between enum values', () => {
      expect(AuditAction.CREATE).toBe(AuditAction.CREATE)
      expect(AuditAction.UPDATE).not.toBe(AuditAction.CREATE)
      expect(AuditAction.LOGIN).not.toBe(AuditAction.LOGOUT)
    })

    it('should be immutable', () => {
      const actionKeys = Object.keys(AuditAction)
      expect(actionKeys).toContain('CREATE')
      expect(actionKeys).toContain('UPDATE')
      expect(actionKeys).toContain('DELETE')
      expect(actionKeys).toContain('LOGIN')
      expect(actionKeys).toContain('LOGOUT')
      expect(actionKeys).toContain('LOGIN_FAILED')
      expect(actionKeys).toContain('PASSWORD_CHANGE')
      expect(actionKeys).toContain('EMAIL_CHANGE')
    })
  })

  describe('String Representation', () => {
    it('should use lowercase snake_case for multi-word actions', () => {
      expect(AuditAction.LOGIN_FAILED).toBe('login_failed')
      expect(AuditAction.PASSWORD_CHANGE).toBe('password_change')
      expect(AuditAction.EMAIL_CHANGE).toBe('email_change')
    })

    it('should use simple lowercase for single-word actions', () => {
      expect(AuditAction.CREATE).toBe('create')
      expect(AuditAction.UPDATE).toBe('update')
      expect(AuditAction.DELETE).toBe('delete')
      expect(AuditAction.LOGIN).toBe('login')
      expect(AuditAction.LOGOUT).toBe('logout')
    })
  })

  describe('CRUD Operations', () => {
    it('should have all basic CRUD actions', () => {
      const crudActions = [AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE]

      expect(crudActions).toContain('create')
      expect(crudActions).toContain('update')
      expect(crudActions).toContain('delete')
      expect(crudActions).toHaveLength(3)
    })

    it('should distinguish between CRUD and auth actions', () => {
      const authActions = [
        AuditAction.LOGIN,
        AuditAction.LOGOUT,
        AuditAction.LOGIN_FAILED,
        AuditAction.PASSWORD_CHANGE,
        AuditAction.EMAIL_CHANGE,
      ]

      expect(authActions).not.toContain(AuditAction.CREATE)
      expect(authActions).not.toContain(AuditAction.UPDATE)
      expect(authActions).not.toContain(AuditAction.DELETE)
    })
  })

  describe('Usage in Functions', () => {
    it('should work as function parameter', () => {
      function getActionLabel(action: AuditAction): string {
        const labels: Record<AuditAction, string> = {
          [AuditAction.CREATE]: 'Created',
          [AuditAction.UPDATE]: 'Updated',
          [AuditAction.DELETE]: 'Deleted',
          [AuditAction.LOGIN]: 'Logged In',
          [AuditAction.LOGOUT]: 'Logged Out',
          [AuditAction.LOGIN_FAILED]: 'Login Failed',
          [AuditAction.PASSWORD_CHANGE]: 'Password Changed',
          [AuditAction.EMAIL_CHANGE]: 'Email Changed',
        }
        return labels[action]
      }

      expect(getActionLabel(AuditAction.CREATE)).toBe('Created')
      expect(getActionLabel(AuditAction.LOGIN)).toBe('Logged In')
      expect(getActionLabel(AuditAction.PASSWORD_CHANGE)).toBe('Password Changed')
    })

    it('should work in switch statements', () => {
      function getActionPriority(action: AuditAction): 'high' | 'medium' | 'low' {
        switch (action) {
          case AuditAction.DELETE:
          case AuditAction.LOGIN_FAILED:
          case AuditAction.PASSWORD_CHANGE:
            return 'high'
          case AuditAction.CREATE:
          case AuditAction.UPDATE:
          case AuditAction.EMAIL_CHANGE:
            return 'medium'
          case AuditAction.LOGIN:
          case AuditAction.LOGOUT:
            return 'low'
          default:
            return 'low'
        }
      }

      expect(getActionPriority(AuditAction.DELETE)).toBe('high')
      expect(getActionPriority(AuditAction.CREATE)).toBe('medium')
      expect(getActionPriority(AuditAction.LOGIN)).toBe('low')
    })

    it('should categorize actions by type', () => {
      function isCrudAction(action: AuditAction): boolean {
        const dataActions = [AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE] as const
        return (dataActions as readonly AuditAction[]).includes(action)
      }

      function isAuthAction(action: AuditAction): boolean {
        const authActions = [
          AuditAction.LOGIN,
          AuditAction.LOGOUT,
          AuditAction.LOGIN_FAILED,
          AuditAction.PASSWORD_CHANGE,
          AuditAction.EMAIL_CHANGE,
        ] as const
        return (authActions as readonly AuditAction[]).includes(action)
      }

      expect(isCrudAction(AuditAction.CREATE)).toBe(true)
      expect(isCrudAction(AuditAction.LOGIN)).toBe(false)
      expect(isAuthAction(AuditAction.LOGIN)).toBe(true)
      expect(isAuthAction(AuditAction.UPDATE)).toBe(false)
    })
  })

  describe('Iteration', () => {
    it('should be iterable via Object.values', () => {
      const values = Object.values(AuditAction)
      expect(values).toContain('create')
      expect(values).toContain('update')
      expect(values).toContain('delete')
      expect(values).toContain('login')
      expect(values).toContain('logout')
      expect(values).toContain('login_failed')
      expect(values).toContain('password_change')
      expect(values).toContain('email_change')
      expect(values).toHaveLength(8)
    })

    it('should allow iteration for validation', () => {
      const validActions = Object.values(AuditAction)

      expect(validActions.includes('create')).toBe(true)
      expect(validActions.includes('login')).toBe(true)
      expect(validActions.includes('invalid_action' as AuditAction)).toBe(false)
    })
  })
})

describe('EntityType and AuditAction Integration', () => {
  describe('Combined Usage', () => {
    it('should work together in audit log context', () => {
      interface AuditEntry {
        entityType: EntityType
        action: AuditAction
      }

      const userCreation: AuditEntry = {
        entityType: EntityType.USER,
        action: AuditAction.CREATE,
      }

      const chatDeletion: AuditEntry = {
        entityType: EntityType.CHAT,
        action: AuditAction.DELETE,
      }

      const loginAttempt: AuditEntry = {
        entityType: EntityType.USER,
        action: AuditAction.LOGIN,
      }

      expect(userCreation.entityType).toBe('user')
      expect(userCreation.action).toBe('create')
      expect(chatDeletion.entityType).toBe('chat')
      expect(chatDeletion.action).toBe('delete')
      expect(loginAttempt.entityType).toBe('user')
      expect(loginAttempt.action).toBe('login')
    })

    it('should validate action compatibility with entity type', () => {
      function isValidCombination(entityType: EntityType, action: AuditAction): boolean {
        // Auth actions only apply to USER entity
        const authActions = [
          AuditAction.LOGIN,
          AuditAction.LOGOUT,
          AuditAction.LOGIN_FAILED,
          AuditAction.PASSWORD_CHANGE,
          AuditAction.EMAIL_CHANGE,
        ] as const

        if ((authActions as readonly AuditAction[]).includes(action)) {
          return entityType === EntityType.USER
        }

        // CRUD actions apply to all entities
        return true
      }

      expect(isValidCombination(EntityType.USER, AuditAction.LOGIN)).toBe(true)
      expect(isValidCombination(EntityType.CHAT, AuditAction.LOGIN)).toBe(false)
      expect(isValidCombination(EntityType.CHAT, AuditAction.CREATE)).toBe(true)
      expect(isValidCombination(EntityType.MESSAGE, AuditAction.UPDATE)).toBe(true)
    })
  })

  describe('Type Completeness', () => {
    it('should have complete entity type coverage', () => {
      const allEntityTypes: EntityType[] = [
        EntityType.USER,
        EntityType.CHAT,
        EntityType.MESSAGE,
        EntityType.PART,
        EntityType.AI_OPTIONS,
      ]

      expect(allEntityTypes).toHaveLength(5)
      expect(new Set(allEntityTypes).size).toBe(5) // No duplicates
    })

    it('should have complete action coverage', () => {
      const allActions: AuditAction[] = [
        AuditAction.CREATE,
        AuditAction.UPDATE,
        AuditAction.DELETE,
        AuditAction.LOGIN,
        AuditAction.LOGOUT,
        AuditAction.LOGIN_FAILED,
        AuditAction.PASSWORD_CHANGE,
        AuditAction.EMAIL_CHANGE,
      ]

      expect(allActions).toHaveLength(8)
      expect(new Set(allActions).size).toBe(8) // No duplicates
    })
  })
})
