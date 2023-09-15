export const formatErrorMessage = (error: string | string[]): string => JSON.stringify({ errors: Array.isArray(error) ? error : [error] });
