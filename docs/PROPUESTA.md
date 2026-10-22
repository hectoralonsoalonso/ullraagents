# Propuesta completa

Estado: diseño para revisión; no representa funcionalidades implementadas. [Trazabilidad y origen](REQUISITOS.md).

## Objetivo y salida
Cada participante recibe el día anterior al evento un email con sus tres personas de mayor afinidad y motivos de conexión. Para cada recomendación se proponen tres rompehielos off-topic y dos temas on-topic. **La unidad «por recomendación» es un supuesto pendiente de confirmar**; el briefing confirma cantidades pero permite ambigüedad respecto al email completo.

El objetivo de fecha no autoriza envíos automáticos. El sistema prepara y revisa; el equipo pulsa Enviar. Si no hay suficientes candidatos válidos o información fiable, se abre incidencia, sin inventar afinidad.

## Interfaz y entradas
Panel para múltiples eventos/ciudades, fecha y zona horaria, inscripciones, catálogos, reglas y bandeja de revisión. Formulario: LinkedIn, qué ofrece, retos/necesidades, buyer persona y correo. Enriquecimiento de nombre, apellidos, cargo y empresa; clasificación de sector y tipo de empresa únicamente contra catálogo proporcionado. Categoría no encontrada o dato contradictorio => revisión, no categoría inventada.

LinkedIn es una dependencia por validar: no se presupone acceso a perfiles, publicaciones o republicaciones. Diseñar un adaptador autorizado y alternativa de aportación/confirmación manual. No comprometer calendario de implementación sin verificar acceso y condiciones aplicables.

## Flujo completo
1. Crear evento y configurar reglas/versiones.
2. Recoger inscripción y separar correo en bóveda.
3. Extraer datos disponibles con procedencia y validar clasificación.
4. Calcular afinidad con fórmula inspeccionada y versionada.
5. Seleccionar hasta tres candidatos válidos; alertar si no se alcanza el objetivo.
6. Sniper cruza intereses y evidencias de ambas personas.
7. Redactor crea email con razones y temas.
8. Censor y revisor contrastan fuentes originales y políticas.
9. Bandeja muestra OK o incidencia, con justificación.
10. Humano revisa y pulsa Enviar sobre versión concreta; servicio revalida y deduplica.

## Matching
La calculadora referenciada por el usuario será la base. Falta inspeccionar el archivo: no se fijan pesos, escalas, normalizaciones ni desempates definitivos. Separar restricciones excluyentes y preferencias; evaluar ofertas/necesidades y buyer persona según fórmula validada. Ausencia de dato no equivale a incompatibilidad. La recomendación puede ser direccional, no se impone reciprocidad.

## Sniper de intereses
Usar publicaciones y republicaciones disponibles y autorizadas; conservar fuente, fecha y respaldo mínimo para cada afirmación. Distinguir hecho declarado, conexión profesional posible y pregunta abierta. No inferir hechos sensibles ni afirmar intereses compartidos solo por una similitud débil. Si faltan datos, sugerir preguntas neutrales sin premisas: «¿Qué actividad te ayuda a desconectar del trabajo?»; nunca «Como a ambos os encanta correr» sin evidencia.

## Temas profesionales y redacción
Cruzar lo que ofrece y necesita cada persona y su buyer persona. Proponer conversaciones útiles sin prometer negocios. Redactor no introduce hechos nuevos. Cantidad, tono, longitud y estilo configurables; cambios trazables.

## Revisor independiente
Acceso al borrador, perfiles originales relevantes, evidencias y reglas. Comprobar identidad, pertenencia al evento, utilidad de la conexión, afirmaciones respaldadas, contradicciones, exposición de datos y cantidades. Salida estructurada: OK o incidencia, fragmento, razón y posible corrección. No dar OK únicamente porque coinciden dos agentes. Incidencia no resuelta bloquea envío; OK no es autorización de envío.

## Configuración editable
Catálogos, pesos cuando se conozcan, umbrales, restricciones, desempates, fuentes permitidas, antigüedad, temas excluidos, preguntas neutrales, plantillas, censor y criterios de OK. Separar alcance global/evento y roles. Versionar autor/fecha y simular antes de publicar. Cambios relevantes obligan a regenerar/revisar borradores afectados.

## Bandeja de revisión y envío
Mostrar destinatario solo a roles autorizados, matches, borrador, OK/incidencia y evidencias desplegables. Acciones: editar, regenerar, resolver incidencia, enviar. No permitir «resolver» saltándose una política: tras edición se reejecutan controles. Aprobación humana vinculada al contenido y destinatario exactos; cambios invalidan la revisión/aprobación. Revalidar baja, cancelación, evento, vigencia y censura al enviar. Clave de idempotencia y estados explícitos para reintentos/fallos parciales.

## Seguridad, pruebas y lanzamiento
Bóveda de correo separada; agentes sin acceso general a disco ni conectores; aislamiento de eventos en almacenamiento, búsquedas, cachés y exportaciones. Tickets y fuentes son datos no confiables. Censor de DNI/NIE, IBAN y reglas ampliables en salidas, trazas y exportaciones. Retención/borrado y accesos por definir antes de usar datos reales.

[Seguridad](SEGURIDAD.md) y [harness](PRUEBAS.md) concretan controles y pruebas. Fases: cerrar dependencias; eventos/formulario; matching; sniper/redactor/revisor; seguridad y harness; bandeja; piloto sin envío; piloto manual reducido. No hay despliegue público ni envío real autorizado por esta preparación.
