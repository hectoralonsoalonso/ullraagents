# Seguridad y privacidad: demo y producción futura

No es auditoría legal ni garantía de cumplimiento. Esta demo usa datos ficticios y solo localhost; no debe publicarse tal cual.

## Controles implementados y probados en HTTP
- Bind explícito 127.0.0.1. Host localhost/127.0.0.1 con puerto real; origen exacto y Sec-Fetch-Site no externo. Rechazo de DNS rebinding por host inesperado.
- Sesión local aleatoria HttpOnly, SameSite=Strict. POST/PATCH necesitan cookie, X-CSRF-Token y Origin; sin CORS permisivo. No es identidad humana verificada. Cookie sin Secure solo por HTTP localhost; producción requiere HTTPS y auth real.
- Rutas de assets/docs cerradas por allowlist; no lectura arbitraria de archivos ni ejecución de URLs/código recibido.
- CSP sin scripts inline/externos ni frames, escape de contenido dinámico, documentos por textContent, no HTML interpretado desde los formularios. QA de render XSS en navegador pendiente, no confundir con tests HTTP.
- JSON limitado a 24 KB, límites de objetos en memoria y campos, catálogo cerrado y claves extra rechazadas. Sin logs de payloads/secretos. Estado volátil; reiniciar borra sesión/datos/borradores/recibos.
- Contactos @example.test en Map separado. La API no devuelve correos en bootstrap/perfiles/matches/evidencias. matchingProfile elimina nombre/cargo/empresa/contacto y exige synthetic:true. El marcador no prueba autenticidad de los datos: el operador debe introducir solo ficción.
- Censor conservador DNI/NIE/IBAN en texto de entrada y borrador; identificadores normales y espaciados provocan bloqueo o redacción sin reproducir el valor. No es un detector completo de PII; puede tener falsos positivos y evasiones no cubiertas. No se transmite texto a servicios externos.
- Campos/tickets/fuentes son datos, nunca instrucciones ejecutables. Demo no dispone de herramientas LLM ni conectores. Regex de instrucciones sospechosas aporta señal adicional, no es una defensa universal contra prompt injection.

## Revisión y envío simulado
Borrador vinculado a sesión local. Edición incrementa revisión y elimina OK; texto distinto de baseline genera incidencia en revisor determinista. Cambio de reglas invalida revisión. Revisor comprueba cantidades, versión, candidatos e identificadores. No verifica semánticamente afirmaciones libres; pide regenerar.

Simular envío exige confirm:true y revisión OK vigente; revalida candidato/estado/reglas/contacto. Dedupe en memoria por evento+destinatario+versión de reglas+hash del contenido. Reintento o regeneración idéntica devuelve mismo recibo. No SMTP, correo externo, token o identidad real. Reiniciar borra dedupe porque no existe ninguna entrega real.

## Identidad LinkedIn
No configurada; no hay login fake. Única identidad real prevista: la del operador, separada del matching. Configurar app/client ID/callback y secreto por vía segura antes de implementarla. No guardar tokens/perfil/email real en Git/fixtures/logs. Diseño y límites OIDC en [demo](DEMO.md). Login no autoriza scraping ni acceso automático a publicaciones/cargo/empresa.

## Producción futura: controles no implementados todavía
Roles/organización/evento, permisos efectivos de agentes/carpetas/conectores y denegación por defecto; aislamiento de cachés/índices/exportaciones; bóveda persistente real; retención/borrado/derechos; autorización de fuentes; evidencias revocadas/caducadas; censor ampliado y evaluación adversa; autenticación real; HTTPS; auditoría mínima; servicio de envío con aprobación humana y reconciliación parcial. No basta con un prompt o con que pasen estos tests de demo.
