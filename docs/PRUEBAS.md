# Harness y puertas de lanzamiento

## Estado real
Solo existe un catálogo de escenarios y un verificador documental sin dependencias. **Ningún escenario funcional está automatizado ni aprobado todavía.** El comando node scripts/check-docs.mjs valida estructura documental, no políticas de una aplicación.

## Estrategia
Fixtures sintéticos, semilla reproducible, reloj controlado, conectores simulados, sin destinatarios reales. Registrar versión de reglas/modelo, entrada mínima, salida, resultado y motivo sin PII. Separar tests deterministas de evaluación humana de utilidad. Un modelo no debe calificarse solo a sí mismo.

Catálogo inicial: [escenarios](../tests/scenarios.json). Cada caso tiene ID, vínculo de requisito, entrada/estímulo y resultado esperado. Implementar ejecutores al crear componentes; un caso listado no cuenta como aprobado.

## Puertas
- **G0, especificación**: calculadora y cantidades resueltas, catálogos, decisiones trazadas.
- **G1, datos/permisos**: aislamiento positivo y negativo de eventos, carpetas y conectores, correo fuera de agentes.
- **G2, matching**: resultados contrastados con calculadora y conjunto de referencia; umbrales humanos definidos.
- **G3, seguridad**: todos los casos críticos adversos automatizados pasan; cero envíos sin autorización vigente, cero cruces de evento observados en batería; no prometer ausencia absoluta de fallos fuera de ella.
- **G4, contenido/piloto seco**: cantidades, respaldo y tono; revisión humana sin correo real.
- **G5, piloto manual**: aprobación explícita de alcance y contactos, bajas probadas, observabilidad y parada, proveedor configurado sin secretos en repositorio.

No lanzar público ni habilitar envío hasta cerrar las puertas aplicables. Un fallo bloqueante reabre la puerta. Guardar evidencia de ejecución y revisión, no solo un check manual. Repetir batería ante cambio de reglas/modelo/conector.
