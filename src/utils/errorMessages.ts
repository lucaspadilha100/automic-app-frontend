export const errorMessages: Record<string, string> = {
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Acesso não permitido.',
  FEATURE_DISABLED: 'Esta funcionalidade não está disponível no seu plano.',
  PLAN_LIMIT_REACHED: 'Limite do plano atingido.',
  SERVICE_LIMIT_REACHED: 'Limite de serviços atingido.',
  PROFESSIONAL_LIMIT_REACHED: 'Limite de profissionais atingido.',
  APPOINTMENT_CONFLICT: 'Este horário não está mais disponível.',
  VALIDATION_ERROR: 'Verifique os dados informados.',
  NOT_FOUND: 'Recurso não encontrado.',
  INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  INTERNAL_ERROR: 'Erro interno. Tente novamente.',
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as { code?: string; message?: string }
    if (e.code && errorMessages[e.code]) return errorMessages[e.code]
    if (e.message) return e.message
  }
  return 'Erro inesperado. Tente novamente.'
}
