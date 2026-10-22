# Propuesta completa · demo local primero

Alcance actualizado con las correcciones del usuario del 22 de octubre de 2026. [Trazabilidad](REQUISITOS.md). La demo funcional y la visión de producción son fases distintas.

## Alcance actual
Web local en español con datos inventados, dos eventos/ciudades y 18 asistentes ficticios iniciales. Creación de eventos y participantes, catálogo cerrado, matching top 3, explicación de puntuación/cobertura, ajustes versionados, borrador, revisión y envío exclusivamente SIMULADO. No se publica en Internet. Datos volátiles en memoria; no se recogen asistentes reales ni se conecta SMTP o un LLM.

El único dato real previsto es la identidad del operador a través de LinkedIn OIDC: pendiente de configuración, claramente indicado. No hay un login fake presentado como auténtico. Login no equivale a permiso para leer publicaciones/cargo/empresa. La demo usa evidencias fechadas ficticias, nunca scraping. Ver [demo y login](DEMO.md).

## Panel y formulario
Panel con eventos, participantes, explorar conexiones, criterios y propuesta. **Retirado el apartado global de estado de preparación/incidencias/envíos**. La revisión específica del borrador se conserva para respetar OK/incidencia + clic humano.

Formulario ficticio: nombre, cargo, empresa, sector y tipo de empresa de catálogo cerrado, ofrece, necesita/retos, buyer persona, intereses y correo @example.test. El campo profesional se introduce manualmente en esta demo; no se atribuye a LinkedIn. Correo aislado en mapa de contactos y ausente del perfil de matching y de bootstrap.

En producción futura: inscripción con URL de LinkedIn y enriquecimiento solo si existe fuente autorizada y viable; clasificación sector/tipo contra catálogo del organizador, categoría desconocida => revisión. La extracción no está implementada en el mockup; sí los catálogos ficticios cerrados de sector, tipo y etiquetas.

## Matching
Ya no se espera una calculadora adjunta. Por autorización del usuario definimos y probamos la [fórmula v0.1](FORMULA.md): 40 oferta→necesidad del otro, 35 necesidad←oferta del otro, 20 encaje buyer persona, 5 intereses neutrales. Pesos suman 100, configurables. Se normaliza sobre datos observados, mostrando cobertura; desconocido no equivale a cero. Por defecto mínimo 60% de cobertura y 35 puntos. Elegibilidad: mismo evento, personas distintas y activas. Hasta tres válidos; faltantes generan incidencia, no relleno artificial.

## Sniper, redactor y evidencia
Demo: plantillas deterministas, no agentes LLM. Cada pareja recibe preguntas sobre intereses marcados como ficticios o preguntas abiertas sin premisas, más temas profesionales sobre coincidencias de catálogo. Evidencias incluyen fecha fija de fixture 2026-10-22, IDs ficticios y origen “Formulario ficticio; no es LinkedIn”.

Por defecto 3 off-topic y 2 on-topic POR MATCH: unidad aún no confirmada, visible como supuesto y editable de 1 a 5 por tipo. No inventar biografías, publicaciones, aficiones reales ni oportunidades comerciales. Producción futura podrá usar agentes separados con herramientas limitadas y evidencias originales autorizadas.

## Revisor y envío
Revisor determinista demo: contrasta versión de reglas, número de candidatos, pertenencia actual, número de temas, integridad del texto generado, filtro de identificadores e instrucciones sospechosas. Salida OK/incidencia con motivos. No es verificación semántica general: si el texto se edita, pierde OK y el revisor pide regenerar para no aprobar afirmaciones libres sin evidencia. Incidencia bloquea.

El operador debe pulsar Simular envío y confirmar. No SMTP ni destinatario real; se registra recibo simulado e idempotente. Cambiar reglas o texto invalida revisión. Producción futura añadirá autenticación/roles reales, autorización humana sobre contenido/contacto, revalidación de bajas/cancelaciones, servicio de correo aislado y reconciliación de fallos parciales. Nada de eso se activa por preparar esta demo.

## Configuración y seguridad
Pesos, cobertura, umbral y cantidades se editan ya desde UI; cada guardado crea versión y fuerza regeneración. Catálogos, retención, políticas, estilo y permisos completos permanecen en backlog de producción. No se promete que todos los criterios empresariales sean editables todavía.

HTTP solo 127.0.0.1; allowlist de hosts y recursos; CSP sin scripts inline; escape de contenido; cuerpo JSON limitado; validación de catálogo; sesión local/CSRF y verificación de origen para mutaciones. Censor conservador DNI/NIE/IBAN con bloqueo/redacción. No registra cuerpos ni credenciales. El marcador synthetic protege el contrato de demo, no prueba que un humano nunca escriba un nombre real; la UI exige datos ficticios.

[Seguridad](SEGURIDAD.md), [pruebas](PRUEBAS.md) y [backlog](BACKLOG.md) distinguen implementación y pendientes. No afirmar cumplimiento o seguridad de producción por pasar tests locales.
