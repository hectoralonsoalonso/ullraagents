# Backlog de implementación

Lista inicial local; no equivale a issues ya creadas en GitHub. P0 = primero, P1 = siguiente. Dependencias indicadas para evitar implementar scoring o conectores sin información.

| ID | Prioridad | Entregable | Depende | Aceptación |
|---|---|---|---|---|
| B01 | P0 | Inspeccionar calculadora y casos de ejemplo | Archivo | Fórmula versionada y resultados de referencia H14 |
| B02 | P0 | Resolver ambigüedades y catálogos | Validación humana | DECISIONES actualizada y R06 sin ambigüedad |
| B03 | P0 | ADR stack / alternativas existentes | Revisión técnica | Opciones, coste, pruebas, decisión revisada |
| B04 | P0 | Contratos y datos sintéticos | B02, B03 | Esquemas cerrados, validación y ausencia de email en matching |
| B05 | P0 | Eventos, inscripción y bóveda | B04 | H01-H04 y permisos negativos |
| B06 | P0 | Motor de afinidad explicable | B01, B04 | H05/H14/H20; no fórmula improvisada |
| B07 | P1 | Adaptador de evidencia y fallback manual | Viabilidad fuente, B04 | Fuentes fechadas y estados de ausencia |
| B08 | P1 | Sniper + redactor | B06, B07 | H06/H19, hechos respaldados y preguntas neutrales |
| B09 | P0 | Censor y aislamiento de herramientas | B04 | H09/H12/H13, denegaciones comprobadas |
| B10 | P1 | Revisor y bandeja | B08, B09 | H15/H16/H17, incidencias bloquean |
| B11 | P1 | Envío manual idempotente en sandbox | B10 | H16/H18; proveedor simulado antes del real |
| B12 | P0 | Harness automatizado funcional | Vertical B05-B11 | Todos los escenarios ejecutados, no solo listados |
| B13 | P1 | Piloto sin envío y revisión de privacidad | B12 | G0-G4 de PRUEBAS |
| B14 | P1 | Piloto manual limitado | B13, aprobación humana | G5 y plan de parada |

Definición de hecho: código revisado, pruebas observadas, documentación actualizada, sin secretos/PII, permisos comprobados y ninguna activación externa implícita.
