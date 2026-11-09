# Changelog

## [1.10.0-secciones](https://github.com/recursos-email-pintureria/inventario-pintura-local/compare/v1.9.0-secciones...v1.10.0-secciones) (2026-11-09)


### Features

* add zero-stock product removal functionality ([79dd04f](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/79dd04f9ff6563fc87f0c9b56fc74fcffd14df4e))
* añadir importación masiva de productos a armario desde CSV (parser, validador, UI y RPC) ([a25b515](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/a25b515d0180896d3a1f9f9b3f0ef9b6472d0fd0))
* añadir modal de limpieza de lotes antiguos con función RPC ([8ecb3ff](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/8ecb3ffbdabc13392fddb9842a500410b5de6540))
* **csv:** añadir transformador a formato canónico para importador adaptativo ([e43e9d5](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/e43e9d5fd0c3ee85c6801ffd95e0daf56db58464))
* **csv:** importador adaptativo funcional + documentar deuda técnica de modo oscuro ([fe5fbfe](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/fe5fbfe4592c744d8664272bac210b1e719262d3))
* **csv:** importador adaptativo funcional con colores Tailwind estándar ([0ed52ab](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/0ed52ab0b30883c820cd7177f05918f4355bd0fa))
* **csv:** integrar panel de mapeo en wizard de importación ([914b788](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/914b788cae4272a24801fcc83a1e64efedd1eba1))
* **csv:** panel de mapeo robusto con refs, stealing y tokens semánticos ([2732ed9](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/2732ed994305db90477ae113d091d3f2a72df524))
* **csv:** parser robusto con detección de separador, codificación y BOM ([8987614](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/8987614daa2d5c69b405a683740c5498df266cc4))
* **csv:** persistencia de mapeos en Supabase ([6fa01ae](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/6fa01ae7e49cdd00b472929c38243c874a2dfcc1))
* importar productos desde CSV y reversión de lotes ([c8d6ff8](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/c8d6ff85be1bc1912d0874aa33bec43a03712d54))


### Bug Fixes

* actualizar modal de limpieza para reflejar la RPC blindada y validar permisos ([ac87d99](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/ac87d99d56673e4e4edd7149118f95af4355fba8))
* actualizar version a v1.9.0-secciones y forzar visibilidad de gestion de secciones para diagnostico ([511c607](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/511c60748f1a6f32505417003945a6437f7a8c7c))
* corregir función revertir_lote_importacion con split_part para lectura segura de JSON ([dc81650](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/dc8165003d02e9c22b1e781b1e18a22ad0112b55))
* **csv:** hacer sugerirMapeo 100% determinista ([5e0c03e](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/5e0c03e39fd8dc2fba2b915ee58965e74508e451))
* **csv:** reemplazar seleccionarArchivo con parser adaptativo ([836bcdd](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/836bcdd7a8c49d9bde9334d2eb0ad1e37d620d7e))
