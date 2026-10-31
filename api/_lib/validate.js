const COMMON = new Set(['password1', 'password123', '12345678a', 'qwerty123', 'letmein1', 'welcome1', 'abc12345', 'iloveyou1'])

// Returns a friendly reason the password is too weak, or null if it's fine.
export function passwordProblem(password) {
  if (!password) return 'Please choose a password.'
  if (password.length < 8) return 'Passwords need at least 8 characters.'
  if (password.length > 72) return 'Passwords can be at most 72 characters.'
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return 'Use at least one letter and one number in your password.'
  if (COMMON.has(password.toLowerCase())) return 'That password is too common. Try something more unique.'
  return null
}
