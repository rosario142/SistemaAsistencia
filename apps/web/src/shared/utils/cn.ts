/** Une clases condicionales en una cadena única (sustituto ligero de `clsx`). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter((cls): cls is string => typeof cls === 'string' && cls.length > 0).join(' ');
}
