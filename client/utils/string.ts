// Compares 2 strings with case-insensitive search
export const isStringsEqualCaseInsensitive = (str1: string, str2: string): boolean => (
    str1.toLowerCase() === str2.toLowerCase()
)