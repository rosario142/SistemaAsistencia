# ADR-NNN: Título de la decisión

- **Estado**: Propuesto | Aceptado | Obsoleto | Reemplazado por ADR-XXX
- **Fecha**: AAAA-MM-DD
- **Decisores**: nombres/roles involucrados

> Reglas del formato (basado en MADR):
> - Un ADR por archivo, numerado correlativamente (`ADR-001-...`, `ADR-002-...`).
> - El **estado** solo cambia mediante un nuevo ADR que lo reemplace.
> - Ser concreto: alternativas reales, con sus trade-offs, no generalidades.

## Contexto

Describe el problema o la fuerza que obliga a decidir. Incluye:
- qué situación lo provoca (nuevo sistema, restricción técnica, incidente),
- restricciones aplicables (equipo, plazo, stack, presupuesto),
- qué pasa si no se decide (consecuencia de mantener el status quo).

## Decisión

La decisión tomada, en afirmativo y en voz activa. Ejemplo: «Adoptamos X para Y,
con la condición Z». Si aplica, incluye:
- tecnología/patrón elegido y su versión,
- reglas de uso obligatorias (convenciones, límites del alcance),
- cómo se aplica en el repo (rutas, scripts, servicios).

## Consecuencias

**Positivas**
- Beneficio 1 (medible cuando sea posible).
- Beneficio 2.

**Negativas / riesgos**
- Coste o deuda introducida.
- Riesgo y su mitigación asociada.

## Alternativas consideradas

| Alternativa | Ventajas | Por qué se descarta |
|---|---|---|
| Opción B | ... | ... |
| Opción C | ... | ... |

Detalle narrativo de las alternativas descartadas si la tabla no basta.
