# Fuentes y trazabilidad

Fecha de recopilación: 2026-10-22. No se incorporan transcripciones completas ni datos de participantes.

## Fuentes inspeccionadas
- **U1**: mensaje original del usuario recuperado mediante sessions_history de la conversación «Plan de agente de matching para eventos», 22 de octubre de 2026. Incluye eventos, formulario, resultados, controles y referencia a calculadora. Se leyó el texto; la calculadora no estaba disponible en el contenido recuperado.
- **U2**: ampliación del usuario: sniper de intereses para el email, revisor sobre la información de ambos, OK/incidencia y envío pulsado por humanos.
- **U3**: autorización de trabajar en GitHub, iniciar proyecto, subir propuesta y URL del repositorio.
- **P1**: propuesta consolidada del asistente; decisiones de diseño, no aprobación automática del usuario.

| ID | Fuente | Requisito / decisión | Estado | Componente | Comprobación | Pendiente |
|---|---|---|---|---|---|---|
| R01 | U1 | Crear múltiples eventos en distintas ciudades | Confirmado | Panel / eventos | H01 | Diseño UI |
| R02 | U1 | Formulario: LinkedIn, ofrece, retos/necesita, buyer persona, correo | Confirmado | Inscripción | H02 | Campos obligatorios y consentimiento |
| R03 | U1 | Extraer nombre, apellidos, cargo, empresa; sector/tipo según catálogo propio | Confirmado como objetivo | Extracción / clasificación | H03 | Acceso técnico a fuente y catálogo |
| R04 | U1 | Aislar correo del resto de datos | Confirmado | Bóveda de contacto | H04 | Implementación |
| R05 | U1 | Email el día anterior con 3 personas de mayor afinidad | Confirmado | Matching / operación | H05 | Calculadora y horario |
| R06 | U1 | 3 off-topic y 2 on-topic; off-topic desde publicaciones/RT; alternativa no comprometida | Cantidades confirmadas; unidad por match propuesta | Sniper / redacción | H06 | Confirmar por match o por email |
| R07 | U1 | Editar criterios y decisiones en cualquier momento | Confirmado | Configuración | H07 | Roles de edición |
| R08 | U1 | Datos personales y harness | Confirmado | Seguridad / pruebas | H08 | Retención y permisos |
| R09 | U1 | Tickets envenenados y ausencia de datos | Confirmado | Ingesta / políticas | H09, H10 | Implementación |
| R10 | U1 | Puertas de lanzamiento y batería de políticas | Confirmado | CI / pruebas | H11 | Umbrales de calidad |
| R11 | U1 | Censor de salidas: DNI, IBAN, etc. | Confirmado | Filtro de salida | H12 | Lista ampliada |
| R12 | U1 | Permisos por agente, carpetas y conectores | Confirmado | Autorización | H13 | Modelo de ejecución |
| R13 | U1 | Usar calculadora adjunta | Confirmado; archivo no inspeccionado | Scoring | H14 | Archivo / fórmula |
| R14 | U2 | Sniper de intereses y revisor independiente de ambos perfiles | Confirmado | Agentes | H15 | Implementación |
| R15 | U2 | OK o incidencia; humanos pulsan enviar | Confirmado | Revisión / envío | H16 | Implementación |
| R16 | U3 | Iniciar repositorio y subir propuesta | Confirmado | GitHub | Verificación Git | Escritura remota |
| P01 | P1 | Evidencias fechadas, versionado, invalidación de OK y deduplicación | Diseño propuesto | Transversal | H17, H18 | Validar diseño |
| P02 | P1 | No inventar hechos; preguntas abiertas de respaldo | Interpretación segura propuesta | Sniper | H19 | Validar estilo |
| P03 | P1 | Menos de 3 candidatos válidos => incidencia, no rellenar artificialmente | Excepción propuesta | Matching | H20 | Aprobación de negocio |
| P04 | P1 | Separación estricta por evento y reutilización explícita | Diseño propuesto | Datos / permisos | H01, H13 | Regla de reutilización |

La frase «inventamos uno» se interpreta como inventar una pregunta neutral, nunca un dato personal. Ningún peso de scoring propuesto anteriormente por el asistente se considera fórmula aprobada.
