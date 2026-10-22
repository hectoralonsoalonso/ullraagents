# Arquitectura: implementación local y evolución

## Decisión reversible de demo
Node.js built-in HTTP, ESM, crypto y node:test; frontend HTML/CSS/JS sin dependencias ni CDN. El usuario ha pedido montar la demo local; se evita elegir un framework o contratar servicios antes de validar el flujo. No es una decisión definitiva de stack de producción. Integración futura: revisar opciones mantenidas/OSS, licencias/coste/permisos y registrar ADR antes de adoptar.

## Implementado
- [Servidor HTTP](../server.mjs): rutas cerradas, validación de entradas, sesiones locales, CSRF y datos en memoria.
- [Motor puro](../src/affinity.mjs): reglas v0.1 y top 3 con explicación.
- [Datos demo](../src/demo-data.mjs): dos eventos, 18 perfiles ficticios, contactos en Map separado y catálogo cerrado.
- [Censor](../src/safety.mjs): filtro conservador e instrucciones sospechosas, sin ejecución de herramientas.
- [Interfaz](../web/index.html): eventos, participantes, conexiones, ajustes, documentos; sin panel global de incidencias/envíos.
- [Tests motor](../tests/affinity.test.mjs) y [tests HTTP](../tests/api.test.mjs).

## API local
GET /health (sin datos); GET /api/bootstrap (crea sesión local y token CSRF, datos sin emails); GET /api/matches?participantId=ID.
POST /api/events; POST /api/participants (email ficticio en almacén separado); POST /api/rules (invalida revisión).
POST /api/drafts; GET/PATCH /api/drafts/:id; POST /api/drafts/:id/review; POST /api/drafts/:id/send con confirm:true.
POST/PATCH requieren cookie local + X-CSRF-Token + Origin exacto. Borrador vinculado a sesión local. Esto NO es autenticación de usuario real ni multitenancy productivo.

Rutas estáticas y docs mediante allowlists, nunca convertir una URL recibida en ruta de disco arbitraria. Máximo 24 KB por body y límites de objetos de demo. CSP prohíbe scripts externos/inline y frames. No conexiones salientes de aplicación. LinkedIn real: no configurado, sin endpoint de identidad inventada.

## Contratos
Participant público incluye nombre ficticio/cargo/empresa, sector, tipo y etiquetas; matchingProfile selecciona SOLO IDs opacos, evento, estado, synthetic y listas de catálogo. Contact contiene email @example.test y no sale en bootstrap/matching. Evidence tiene origen/fecha/IDs ficticios. Match tiene score, cobertura y componentes. Draft tiene revisión, baseline privado, reglas, contenido, evidencias y review. Baseline y propietario se excluyen de respuesta.

Revisión: pendiente → OK/incidencia. Editar elimina review; reglas nuevas invalidan review y obligan a regenerar. El envío simulado valida nuevamente revisión, versión, estado y candidatos. Recibo idempotente para la misma edición lógica; no tiene efecto SMTP. No hay scheduler ni almacenamiento de identidad, tokens o sesiones LinkedIn. Reiniciar borra estado demo.

## Producción futura
Separar bóveda real, autorización por organización/evento y herramientas de cada agente; persisted audit minimizada; extractor autorizado; sniper/redactor LLM; censor ampliado; revisor con fuentes originales; proveedor aislado de envío con aprobación humana. Login OIDC solo tras revisar librería mantenida, app/permisos/callback y validación de tokens. Nada está habilitado en la demo por describirlo aquí.
