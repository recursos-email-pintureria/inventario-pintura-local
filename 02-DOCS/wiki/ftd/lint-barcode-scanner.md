---
author: Javier
branch: main
status: in-progress
---
# Mantener limpio el lint del lector de códigos

## Intent

Hacer que `npm run lint` pase sin modificar `src/components/ui/barcode-scanner.tsx`, que está protegido por las reglas del proyecto.

## Scope

Excluir únicamente los errores de formato Prettier de ese archivo en ESLint y evitar que Prettier lo reformatee. Mantener activos los demás chequeos ESLint del archivo y las reglas Prettier para el resto del proyecto.

## Checklist

- [x] Añadir ambas exclusiones específicas y confirmar que no alteran el archivo protegido.
- [x] Ejecutar lint, formato en seco y comprobar el diff.

## Evidence

`npm run lint` terminó con código 0 y sin errores; conserva 9 advertencias preexistentes. ESLint dirigido al componente protegido pasó, por lo que sus otras reglas siguen activas. `prettier --check src/components/ui/barcode-scanner.tsx` confirmó que el archivo se omite. `git diff --exit-code` confirmó que el componente no cambió y `git diff --check` pasó.

## Next

Sin pasos pendientes para esta solución. Las advertencias informativas del lint permanecen.
