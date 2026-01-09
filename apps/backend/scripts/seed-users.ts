#!/usr/bin/env tsx
/**
 * Seed script to populate the users table with a configurable number of accounts
 *
 * Usage:
 *   pnpm seed:users [count]
 *   pnpm seed:users 100
 *
 * Or set via environment variable:
 *   SEED_USER_COUNT=100 pnpm seed:users
 *
 * Default count: 58
 * This will create:
 * - 1 admin account
 * - 2 moderator accounts
 * - Remaining accounts as regular users
 * - Approximately 10% of users (excluding admin/moderators) as OAuth users with Google provider
 *
 * All password-based accounts use the password specified by SEED_PASSWORD env var,
 * or 'Password123!' if SEED_PASSWORD is not set.
 * OAuth users have no password and use 'google' as their provider.
 *
 * Maximum Users:
 * The script can generate approximately 51,840 unique email addresses
 * (72 firstNames × 72 lastNames × 10 domains). If you need more users,
 * the script will throw an error to prevent duplicate email generation.
 */
// TODO: convert to using the test configuration DB instead of the live DB
import { db } from '../src/infrastructure/database/index.js'
import { user } from '../src/infrastructure/database/schema.js'
import { Password } from '../src/domain/value-objects/password.js'

// Get the number of users to create from:
// 1. Command line argument (highest priority)
// 2. Environment variable SEED_USER_COUNT
// 3. Default value of 58
const getUserCount = (): number => {
  // Check command line argument
  const cliArg = process.argv[2]
  if (cliArg) {
    const count = parseInt(cliArg, 10)
    if (isNaN(count) || count < 3) {
      console.error(
        '❌ Error: User count must be a number >= 3 (need at least 1 admin + 2 moderators)'
      )
      process.exit(1)
    }
    return count
  }

  // Check environment variable
  const envCount = process.env.SEED_USER_COUNT
  if (envCount) {
    const count = parseInt(envCount, 10)
    if (isNaN(count) || count < 3) {
      console.error(
        '❌ Error: SEED_USER_COUNT must be a number >= 3 (need at least 1 admin + 2 moderators)'
      )
      process.exit(1)
    }
    return count
  }

  // Default
  return 58
}

const TOTAL_USERS = getUserCount()
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'Password123!'

if (!process.env.SEED_PASSWORD) {
  console.warn(
    '[seed-users] Warning: SEED_PASSWORD environment variable not set. Using default password "Password123!".'
  )
}

// Diverse first names
const firstNames = [
  'James',
  'Mary',
  'John',
  'Patricia',
  'Robert',
  'Jennifer',
  'Michael',
  'Linda',
  'William',
  'Barbara',
  'David',
  'Elizabeth',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
  'Christopher',
  'Nancy',
  'Daniel',
  'Lisa',
  'Matthew',
  'Betty',
  'Anthony',
  'Margaret',
  'Mark',
  'Sandra',
  'Donald',
  'Ashley',
  'Steven',
  'Kimberly',
  'Paul',
  'Emily',
  'Andrew',
  'Donna',
  'Joshua',
  'Michelle',
  'Kenneth',
  'Carol',
  'Kevin',
  'Amanda',
  'Brian',
  'Dorothy',
  'George',
  'Melissa',
  'Edward',
  'Deborah',
  'Ronald',
  'Stephanie',
  'Timothy',
  'Rebecca',
  'Jason',
  'Sharon',
  'Jeffrey',
  'Laura',
  'Ryan',
  'Cynthia',
  'Jacob',
  'Kathleen',
  'Gary',
  'Amy',
  'Nicholas',
  'Shirley',
  'Eric',
  'Angela',
  'Jonathan',
  'Helen',
  'Stephen',
  'Anna',
]

// Diverse last names
const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
  'Carter',
  'Roberts',
  'Gomez',
  'Phillips',
  'Evans',
  'Turner',
  'Diaz',
  'Parker',
  'Cruz',
  'Edwards',
  'Collins',
  'Reyes',
  'Stewart',
  'Morris',
  'Morales',
  'Murphy',
  'Cook',
  'Rogers',
  'Morgan',
  'Peterson',
  'Cooper',
  'Reed',
  'Bailey',
  'Bell',
]

// Email domains for variety
const emailDomains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'aol.com',
  'zoho.com',
  'fastmail.com',
]

/**
 * Generate a unique email address with collision detection
 *
 * Note: This function can generate up to approximately 51,840 unique emails
 * (72 firstNames × 72 lastNames × 10 domains). Beyond this limit, the function
 * will throw an error to prevent duplicate email generation.
 *
 * @param firstName - The first name to use in the email
 * @param lastName - The last name to use in the email
 * @param index - The user index (used for suffix and domain selection)
 * @param existingEmails - Set of already generated emails for collision detection
 * @returns A unique email address
 * @throws Error if unable to generate a unique email after maximum attempts
 */
function generateEmail(
  firstName: string,
  lastName: string,
  index: number,
  existingEmails: Set<string>
): string {
  const maxAttempts = 100
  let attempt = 0

  while (attempt < maxAttempts) {
    const domain = emailDomains[(index + attempt) % emailDomains.length]
    const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    // Add suffix for all indices to improve uniqueness
    const suffix = index + attempt > 0 ? index + attempt : ''
    const email = `${baseEmail}${suffix}@${domain}`

    if (!existingEmails.has(email)) {
      existingEmails.add(email)
      return email
    }

    attempt++
  }

  throw new Error(
    `Unable to generate unique email for ${firstName} ${lastName} after ${maxAttempts} attempts. ` +
      `Maximum recommended user count is approximately ${firstNames.length * lastNames.length * emailDomains.length} ` +
      `(${firstNames.length} firstNames × ${lastNames.length} lastNames × ${emailDomains.length} domains).`
  )
}

/**
 * Generate a full name
 */
function generateName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}

/**
 * Determine role based on index
 */
function getRole(index: number): 'admin' | 'moderator' | 'user' {
  if (index === 0) return 'admin'
  if (index === 1 || index === 2) return 'moderator'
  return 'user'
}

/**
 * Determine if user should be OAuth user (10% chance)
 * OAuth users are evenly distributed throughout the user list
 */
function isOAuthUser(index: number): boolean {
  // Every 10th user (starting from index 3 to preserve admin/moderators)
  return index >= 3 && index % 10 === 3
}

async function seedUsers() {
  console.log('🌱 Starting user seed script...')
  console.log(`📊 Creating ${TOTAL_USERS} user accounts`)
  console.log(`🔐 Password accounts use: ${DEFAULT_PASSWORD}`)
  console.log(`🔗 OAuth accounts (Google): ~10% of users`)

  try {
    // Hash the password once (all password-based users will use the same hashed password)
    console.log('\n⏳ Hashing password...')
    const hashedPassword = (await Password.create(DEFAULT_PASSWORD)).getHash()
    console.log('✅ Password hashed')

    const usersToInsert = []
    const generatedEmails = new Set<string>()
    let oauthUserCount = 0

    console.log('\n👥 Generating user data...')
    for (let i = 0; i < TOTAL_USERS; i++) {
      const firstName = firstNames[i % firstNames.length]
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
      const name = generateName(firstName, lastName)
      const email = generateEmail(firstName, lastName, i, generatedEmails)
      const role = getRole(i)
      const isOAuth = isOAuthUser(i)

      if (isOAuth) {
        oauthUserCount++
        usersToInsert.push({
          name,
          email,
          role,
          provider: 'google',
        })
      } else {
        usersToInsert.push({
          name,
          email,
          password: hashedPassword,
          role,
        })
      }

      // Log special accounts
      if (role === 'admin') {
        console.log(`   👑 Admin: ${email}`)
      } else if (role === 'moderator') {
        console.log(`   🛡️  Moderator: ${email}`)
      }
    }

    console.log(`   👤 Regular users: ${TOTAL_USERS - 3}`)
    console.log(`   🔗 OAuth users (Google): ${oauthUserCount}`)
    console.log(`   🔐 Password users: ${TOTAL_USERS - oauthUserCount}`)

    console.log('\n💾 Inserting users into database...')
    const insertedUsers = await db.insert(user).values(usersToInsert).returning()

    console.log(`\n✅ Successfully created ${insertedUsers.length} users!`)
    console.log('\n📋 Summary:')
    console.log(`   Total users: ${insertedUsers.length}`)
    console.log(`   Admins: ${insertedUsers.filter((u) => u.role === 'admin').length}`)
    console.log(`   Moderators: ${insertedUsers.filter((u) => u.role === 'moderator').length}`)
    console.log(`   Users: ${insertedUsers.filter((u) => u.role === 'user').length}`)
    console.log(
      `   OAuth users (Google): ${insertedUsers.filter((u) => u.provider === 'google').length}`
    )
    console.log(`   Password users: ${insertedUsers.filter((u) => u.password !== null).length}`)
    console.log('\n🔑 Login credentials:')
    console.log(`   Password users:`)
    console.log(`     Email: Any of the generated emails without OAuth`)
    console.log(`     Password: ${DEFAULT_PASSWORD}`)
    console.log(`   OAuth users:`)
    console.log(`     Email: Any of the generated emails marked with OAuth provider`)
    console.log(`     Login via: Google OAuth`)
  } catch (error) {
    console.error('\n❌ Error seeding users:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    // Close the database connection pool
    const { pool } = await import('../src/infrastructure/database/index.js')
    await pool.end()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the seed script
seedUsers()
