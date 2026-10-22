# Arquitectura propuesta

## Decisión de alcance
Arranque documental sin framework elegido. Evaluar opciones existentes y mantenidas antes de construir cada integración; registrar stack, coste, licencia y motivo en ADR. No instalar infraestructura ni contratar servicios en esta fase.

## Componentes
- Panel de eventos y configuración versionada.
- Ingesta y clasificador de catálogo cerrado.
- Adaptador de fuentes: proveedor autorizado o datos aportados; no scraping supuesto.
- Motor determinista de scoring a partir de calculadora pendiente.
- Sniper y redactor con herramientas limitadas.
- Censor determinista + comprobaciones contextuales.
- Revisor con fuentes originales y salida estructurada.
- Bandeja y autorización humana.
- Servicio de envío único, bóveda de contactos y auditoría minimizada.

## Entidades y contratos conceptuales
- Event: id, ciudad, fecha/hora, zona horaria, estado, rulesVersion.
- Participant: id opaco, eventId, perfil profesional, ofrece/necesita/buyerPersona, dataStatus; **sin email**.
- Contact: participantId, email, estado de contacto; repositorio de acceso separado.
- Evidence: id, eventId, persona, fuente, fecha observada, fragmento mínimo, autorización/vigencia.
- Match: eventId, A, B, score, scoreVersion, componentes y explicación verificable.
- Topic: tipo off/on, modo hecho/pregunta, texto, evidenceIds o razón de fallback.
- Draft: id, eventId, destinatario opaco, matches, contenido, revision/hash y policyVersion.
- Review: draftRevision, OK/incidencia, códigos, fragmentos y evidencia.
- SendAuthorization: actor humano autorizado, draftRevision, contacto/version, fecha.
- Delivery: clave idempotente por evento/participante/edición, estado y recibo del proveedor.

Esto no es aún un contrato API implementado. Validar esquemas antes del vertical.

## Estados y reglas
Preparando -> revisión -> OK o incidencia -> listo para clic humano -> enviando -> enviado/error/incierto.
Cambio de contenido, destinatario, candidatos o política aplicable invalida revisión y autorización. Estado incierto de proveedor se reconcilia antes de reintentar; nunca reenviar a ciegas. Una incidencia no permite enviar. Un OK no permite enviar sin acción humana autenticada.

## Operación
El día anterior, preparar borradores según zona horaria del evento. Recurrencia futura irá en scheduler explícito, no un heartbeat ambiguo. No se configura ningún scheduler en este arranque. Idempotencia, colas y almacenamiento se decidirán en ADR. Aplicar revalidación de permisos y pertenencia en cada acceso, no confiar en filtros de UI.
