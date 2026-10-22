# Backlog · demo local y evolución

Lista local, no issues creadas en GitHub. Hecho significa implementado y probado en el alcance especificado, no producto listo para público.

| ID | Prioridad | Entregable | Estado / aceptación | Depende |
|---|---|---|---|---|
| B01 | P0 | Definir fórmula propia v0.1 | Hecho: pesos 40/35/20/5, cobertura/umbrales/versiones, 21 tests motor | U4 |
| B02 | P0 | Mockup sin apartado global de estados | Hecho en HTML/JS; QA browser pendiente | U4 |
| B03 | P0 | Web local reversible sin dependencias | Hecho: Node built-in, frontend propio, bind 127.0.0.1 | U5 |
| B04 | P0 | Datos y catálogos demo | Hecho: 18 perfiles ficticios, 2 eventos, contactos separados | B03 |
| B05 | P0 | Alta eventos/participantes | Hecho en demo; validación de catálogo y correo ficticio | B04 |
| B06 | P0 | Top3 y explicación editable | Hecho; pesos/umbrales/cantidades crean versión | B01,B04 |
| B07 | P0 | Evidencia ficticia y preguntas neutrales | Hecho con plantillas; no LLM/scraping | B04 |
| B08 | P0 | Borrador y revisor demo | Hecho: integridad, cantidades, fuentes demo y reglas | B06,B07 |
| B09 | P0 | Censor y controles API | Hecho alcance demo; pruebas negativas, límites descritos | B03 |
| B10 | P0 | Edición invalida OK | Hecho: nueva revisión; texto no verificable bloqueado | B08 |
| B11 | P0 | Envío humano SIMULADO e idempotente | Hecho: ningún SMTP; dedupe edición lógica y revalidación | B08,B09 |
| B12 | P0 | Motor/API/seguridad ejecutados | 38 tests reales; 24 escenarios catálogo con alcances | B01-B11 |
| B13 | P0 | QA browser desktop/móvil | Pendiente de inspección visual y recorridos reales | B03-B12 |
| B14 | P1 | Login LinkedIn real del operador | Bloqueado app/client ID/callback/secret seguro; no fake | U4 |
| B15 | P1 | Confirmar cantidades por match/email | Pendiente; demo marca supuesto editable | Validación humana |
| B16 | P1 | Calibrar fórmula con organizador | Pendiente; no dependencia de calculadora adjunta | B01 |
| B17 | Futuro | Agentes LLM y fuentes autorizadas | No implementado; fuentes/roles/budget y harness antes | ADR |
| B18 | Futuro | Persistencia, multitenancy y privacidad | No implementado; política/roles/retención antes | ADR |
| B19 | Futuro | Producción/envío real y programación | No autorizado por demo; requiere puertas de lanzamiento | B17,B18 |
| B20 | P1 | Publicar rama/PR GitHub | Pendiente de autenticación; sin push forzado | Conexión GitHub |

No registrar un tema simulado como evidencia real. No mezclar identidad OIDC con fixtures ni participantes sintéticos. No contratar servicios ni abrir puertos públicos para resolver un bloqueo de login.
