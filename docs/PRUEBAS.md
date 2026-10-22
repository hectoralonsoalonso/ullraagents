# Harness y puertas de lanzamiento

## Estado comprobable
38 tests Node realmente ejecutables: 21 en [motor](../tests/affinity.test.mjs), 17 en [API](../tests/api.test.mjs). Ejecutar node --test tests/*.test.mjs. Son pruebas de demo local, no de una plataforma productiva ni de login LinkedIn.

[Catálogo](../tests/scenarios.json): 24 escenarios. planned = no automatizado; partial = pruebas de demo cubren solo parte del requisito; automated = pruebas específicas implementadas para el alcance demo indicado. Tener un testFile NO ejecuta el test: comprobar resultado observado del comando. El verificador node scripts/check-docs.mjs solo valida integridad documental/enlaces/IDs/referencias y patrones básicos de secretos.

## Cobertura real
Motor: pesos/suma/versión, fórmulas y casos exactos, cobertura y ausencia, no coincidencia, direccionalidad, entradas sintéticas/esquema, exclusiones, top3 y desempates.
API: health/HTML/CSP, 18 perfiles ficticios, datos sin email, catálogo cerrado, altas, límites y JSON, host/origin/CSRF/sesión, rutas/traversal, ausencia de login fake, generación de cantidades/evidencias ficticias, OK separado, edición/reglas invalidan, incidencia bloquea, DNI/IBAN redacción y recibo idempotente sin SMTP.

Pendiente QA browser real: desktop/móvil, edición/guardado, formulario y selects, estilos/CSP/render, escape de HTML/XSS en DOM, diálogos y navegación. HTTP 200 no es prueba visual. Tampoco se han probado auth OIDC real, autorización multitenant, retención/borrado, agentes LLM, extracción LinkedIn, proveedor real o scheduler: no existen en esta demo.

## Estrategia
Fixtures sintéticos, sin identidades/contactos reales. Reloj fijo para fecha de evidencia ficticia, no para recibos operativos. Cada test HTTP inicia un servidor 127.0.0.1 en puerto efímero y lo cierra. Sin conectores ni llamadas a terceros. No logs de cuerpos/credenciales. Evaluación de utilidad de recomendaciones requiere revisión humana; score no es éxito comercial.

## Puertas
- **G0 demo**: fórmula propia v0.1 y contratos documentados; unidad por match sigue supuesto configurable, sin bloquear exploración.
- **G1 demo**: tests motor/API pasan y no hay contactos reales ni llamadas externas.
- **G2 demo**: health y assets del servidor desplegado localmente verificados; QA visual desktop/móvil por separado.
- **G3 login real**: app OIDC/credenciales seguras/callback y batería de autenticación antes de activar; actualmente bloqueada, no fingir éxito.
- **G4 producción**: arquitectura/roles/retención/fuentes/proveedores revisados y batería adversa completa. No satisfecha por demo.
- **G5 envío real**: autorización explícita de piloto/contactos, aprobación humana versionada, bajas, idempotencia persistente, observabilidad y parada. No autorizado ni implementado.

Un fallo reabre su puerta. Reiniciar servidor borra estado y dedupe demo; es correcto porque no hay entregas reales. Antes de persistir datos o publicar servicio hay que redefinir estas garantías y probarlas.
