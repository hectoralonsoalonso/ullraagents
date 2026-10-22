# Demo local y LinkedIn

## Correcciones del 22 de octubre de 2026
1. Se retira del PANEL el apartado global “Estado de preparación, incidencias y envíos”. No se elimina el revisor interno OK/incidencia ni la decisión humana sobre cada borrador.
2. Demo local con datos inventados. Único dato real previsto: identidad del operador mediante login LinkedIn OIDC; actualmente NO configurado ni simulado como real.
3. Definimos la [fórmula v0.1](FORMULA.md): no bloquea ninguna calculadora adjunta.
4. Usuario amplía alcance: demo web funcional ejecutándose solo en localhost, sin portal público ni envíos reales.

## Operar
Desde la raíz: node server.mjs. Abrir http://127.0.0.1:4317. Cambiar puerto con PORT; detener con Ctrl+C. Estado volátil en memoria; reiniciar reinicia eventos, reglas, borradores y recibos. No hay autostart ni scheduler. El bind es 127.0.0.1, no 0.0.0.0. No convertirlo en servicio público.

Explorar evento → participante → calcular → generar borrador → revisar → simular envío manual. Probar doble clic/reintento devuelve la misma entrega lógica. Editar invalida OK; texto distinto del generado requiere regenerar porque el revisor demo no verifica afirmaciones libres. Cambiar reglas invalida revisiones. Una incidencia impide simular envío. Contactos ficticios viven en mapa separado y nunca en el perfil de matching, payload de bootstrap o evidencias.

## Login real pendiente, no fake
La interfaz muestra “LinkedIn no configurado” y explica el bloqueo; no hay ruta que devuelva una identidad falsa como login auténtico. Se necesita registrar o seleccionar una app, habilitar Sign in with LinkedIn using OpenID Connect, disponer del client ID y registrar callback local aceptado por el proveedor. Secretos solo por mecanismo local seguro o SecretRef, nunca chat/Git/logs; verificar configuración y permisos reales antes de activar.

Diseño pendiente de implementar: flujo authorization code, state y nonce aleatorios ligados a sesión; validación de firma JWT, issuer, audience, exp y nonce; tokens en servidor, sesión HttpOnly SameSite, expiración/logout y sin logs de token. No activar auth artesanal sin revisar librería mantenida y batería de seguridad.

Fuente primaria de referencia: Microsoft Learn, “Sign In with LinkedIn using OpenID Connect”. URL: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2 . Según la verificación oficial aportada por el agente padre, openid/profile permiten identificación y perfil ligero (ID, nombre, imagen); email es un scope aparte y puede no estar en respuesta. No aportan automáticamente empresa, cargo, publicaciones ni republicaciones. No pedir email si no es necesario para esta identidad.

No mezclaremos esa identidad real con los asistentes ficticios. No habrá scraping, publicación, envío ni exportación de datos del operador. La configuración OIDC requiere sus propios secretos/autorización y no está resuelta por conectar GitHub a OpenClaw.

## Implementado vs pendiente
Implementado: UI, eventos/perfiles ficticios, motor, ajustes, borradores, evidencias ficticias, revisor determinista, barreras e idempotencia simuladas, HTTP local y controles básicos. Pendiente: login real, agentes LLM, extracción autorizada LinkedIn, persistencia y producción. El filtro no es una garantía de detección de toda PII.
