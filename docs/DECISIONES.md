# Decisiones y dependencias actuales

## Resuelto por las correcciones del usuario
- **Calculadora**: deja de ser dependencia. El usuario autoriza definir nuestra fórmula. v0.1 implementada y probada; pesos iniciales propuestos, modificables y sujetos a validación de utilidad.
- **Datos de mockup**: inventados. No usar perfiles/publicaciones reales. Solo identidad real futura del operador por login LinkedIn.
- **UI**: quitar apartado global “Estado de preparación, incidencias y envíos”; mantener revisión específica y envío manual simulado.
- **Ejecución**: demo funcional desplegada en localhost, sin portal público, SMTP o agentes externos. Node built-in sin dependencias como opción reversible para validar el flujo.

## Pendientes por fase
1. Cantidades: confirmar si 3 off-topic + 2 on-topic son por match o por email. Demo usa por match, visible y editable.
2. Login real: aplicación LinkedIn OIDC, client ID, callback autorizado y secreto configurado por vía segura. No solicitar secreto en chat ni almacenar en Git. No bloquea explorar la demo ficticia; sí bloquea demostrar login auténtico.
3. Calidad: revisar fórmula con organizador y conjunto sintético de referencia; no hay calibración comercial validada.
4. Producción: catálogo sector/tipo real, autorización de fuentes (si se requieren), datos/retención/roles, stack e infraestructura mediante ADR, proveedor de correo y operación del día anterior.
5. GitHub: publicación pendiente de autenticación. No forzar push ni crear/mezclar main sin revisar remoto. Trabajo local en rama bootstrap.

No presentar login OIDC como permiso de publicaciones o verificación de identidad civil. No reintroducir calculadora como bloqueo por textos históricos del briefing. Ningún servicio de pago, despliegue público, scheduler o envío real está autorizado por esta demo.

## Plantilla ADR
Contexto; opciones existentes; mantenimiento/licencia/coste; riesgos y permisos; decisión; alternativas descartadas; reversibilidad; verificación; estado propuesta/aceptada/sustituida.
