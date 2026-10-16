import { SetMetadata } from '@nestjs/common';

/** Clave de metadatos que marca un endpoint como accesible sin JWT. */
export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint o controlador como público (omite la autenticación JWT). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
