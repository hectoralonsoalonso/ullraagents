# Fuentes y trazabilidad

Actualización: 2026-10-22. No se incorporan transcripciones completas ni datos reales de participantes.

## Fuentes y precedencia
- **U1**: briefing original recuperado e inspeccionado durante bootstrap, conversación “Plan de agente de matching para eventos”: eventos, formulario, resultados y controles; referencia histórica a calculadora.
- **U2**: sniper de intereses + revisor con información de ambas personas, OK/incidencia y clic humano para enviar.
- **U3**: autorización de arranque y propuesta en repositorio GitHub.
- **U4**: cuatro correcciones adjuntas del usuario, transmitidas por el agente padre a esta tarea: quitar apartado global del panel; datos inventados salvo identidad vía LinkedIn; definir nuestra fórmula; revisar la propuesta. Sustituye la dependencia de calculadora de U1.
- **U5**: ampliación autorizada por el usuario “Nada sigamos desde aquí. Móntalo todo en local y desplegado”, transmitida por padre: demo web funcional localhost, sin publicar ni enviar de verdad. Acepta implementación reversible sin dependencias.
- **P1**: diseño previo del asistente; no equivale a aprobación de todos sus detalles.

| ID | Fuente | Requisito / decisión | Estado actual | Componente | Comprobación | Pendiente |
|---|---|---|---|---|---|---|
| R01 | U1,U5 | Múltiples eventos/ciudades | Demo implementada | Eventos | H01 | Producción/roles |
| R02 | U1,U4 | Formulario y datos profesionales | Adaptado: ficticios manuales, catálogo | Alta | H02 | URL LinkedIn en producción |
| R03 | U1,U4 | Extraer nombre/cargo/empresa y clasificar | Producción futura; no scraping demo | Adaptador futuro | H03 | Fuentes autorizadas y catálogos reales |
| R04 | U1 | Correo aislado del matching | Map ficticio separado | Datos | H04 | Bóveda real futura |
| R05 | U1,U5 | Tres personas afines/email día anterior | Top3 demo; no scheduler | Matching | H05 | Operación real futura |
| R06 | U1,P1 | Tres off-topic y dos on-topic | Plantillas ficticias; unidad por match propuesta editable | Borrador | H06 | Confirmar unidad |
| R07 | U1,U5 | Criterios editables/versionados | Pesos/umbrales/cantidades demo | Ajustes | H07 | Resto políticas futuras |
| R08 | U1,U4 | PII y harness | Fixtures sintéticas y tests parciales reales | Seguridad | H08 | Retención de producción |
| R09 | U1 | Tickets envenenados y ausencia | No ejecutar texto; validar; score ausente explícito | Ingesta/motor | H09,H10 | Evaluación LLM futura |
| R10 | U1 | Puertas de lanzamiento/políticas | Batería demo y puertas documentadas | Tests | H11 | Políticas productivas |
| R11 | U1 | Censor DNI/IBAN | Filtro conservador y pruebas | Salidas | H12 | Cobertura ampliada |
| R12 | U1 | Permisos agentes/carpetas/conectores | Demo sin agentes externos; rutas cerradas | API | H13 | Autorización agentes real |
| R13 | U4 | Definir nuestra fórmula | v0.1 implementada; sustituye calculadora U1 | Motor | H14 | Validación de utilidad |
| R14 | U2,U5 | Sniper y revisor independientes | Simulados con templates/revisor determinista, no LLM | Borrador | H15 | Agentes reales futuros |
| R15 | U2,U5 | OK/incidencia + clic humano | Implementado solo envío SIMULADO | Revisión | H16 | Identidad/SMTP productivos |
| R16 | U3 | Subir propuesta a GitHub | Trabajo local preparado | Git | Verificación Git | Autenticación remota |
| R17 | U4 | Quitar apartado global del panel | Retirado; mantener revisión por borrador | UI | H21 | QA visual |
| R18 | U4 | Solo login propio real; resto ficticio | Demo sin identidad real; login marcado no configurado | Identidad | H22 | App/secret/callback OIDC |
| R19 | U5 | Demo local desplegada | Servidor 127.0.0.1 y assets | HTTP | H23 | QA browser |
| R20 | U5 | API local protegida | Origin/Host/CSRF/esquemas/límites | API | H24 | Endurecimiento producción |
| P01 | P1 | Evidencias/versiones/invalidación/dedupe | Demo implementada | Transversal | H17,H18 | Producción |
| P02 | P1 | No inventar hechos; preguntas abiertas | Plantillas sobre fixtures explícitas | Sniper | H19 | Estilo validado |
| P03 | P1 | Menos de tres válidos => incidencia | Implementado | Matching | H20 | Aprobación de excepción |
| P04 | P1 | Aislamiento de eventos | Matching restringido a evento; no organización real | Datos | H01,H13 | Multitenancy futuro |

La identidad real no es necesaria para navegar la demo ficticia, pero probar login LinkedIn auténtico sí queda bloqueado por configuración. La calculadora histórica ya NO bloquea la fase actual. No presentar pruebas de motor/API como validación completa del producto.
