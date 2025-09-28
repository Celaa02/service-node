/**
 * @typedef {Object} CreateUserInput
 * @property {string} username
 * @property {string} emailLower
 * @property {string} passwordHash
 * @property {string|null} [firstName]
 * @property {string|null} [lastName]
 */

/**
 * @typedef {Object} PublicUserProfile
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string} role
 * @property {string|null} first_name
 * @property {string|null} last_name
 * @property {boolean} is_active
 * @property {string|null} email_verified
 * @property {string|null} last_login
 * @property {string} created_at
 */

export class UserRepository {
  /** @param {string} emailLower @returns {Promise<(PublicUserProfile & {password_hash:string})|null>} */
  findByEmail() {
    throw new Error('Not implemented');
  }

  /** @param {{emailLower:string, username:string}} _ @returns {Promise<boolean>} */
  existsByEmailOrUsername() {
    throw new Error('Not implemented');
  }

  /** @param {CreateUserInput} _ @returns {Promise<Omit<PublicUserProfile,'is_active'|'email_verified'|'last_login'> & {role:string}>} */
  createUser() {
    throw new Error('Not implemented');
  }

  /** @param {string} userId @returns {Promise<PublicUserProfile|null>} */
  getProfileById() {
    throw new Error('Not implemented');
  }

  /** @param {string} userId @returns {Promise<void>} */
  updateLastLogin() {
    throw new Error('Not implemented');
  }
  /** @param {string} userId @returns {Promise<void>} */
  searchUsersRepo() {
    throw new Error('Not implemented');
  }
}
