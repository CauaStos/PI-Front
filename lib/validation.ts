export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Informe o email."
  if (!isValidEmail(email)) return "Informe um email válido."
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return "Informe a senha."
  if (password.length < MIN_PASSWORD_LENGTH)
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
  return null
}

export function validateName(name: string): string | null {
  if (!name.trim()) return "Informe o nome."
  return null
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string
): string | null {
  if (!confirmation) return "Confirme a senha."
  if (password !== confirmation) return "As senhas não coincidem."
  return null
}

export function validateRegistration(input: {
  name: string
  email: string
  password: string
  confirmation: string
}): string | null {
  return (
    validateName(input.name) ??
    validateEmail(input.email) ??
    validatePassword(input.password) ??
    validatePasswordConfirmation(input.password, input.confirmation)
  )
}

export function validateReset(input: {
  password: string
  confirmation: string
  token: string | null
}): string | null {
  if (!input.token) return "Link de redefinicao invalido ou incompleto."
  return (
    validatePassword(input.password) ??
    validatePasswordConfirmation(input.password, input.confirmation)
  )
}
