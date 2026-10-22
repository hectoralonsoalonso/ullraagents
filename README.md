# Ulltra · demo local

![Ulltra](web/assets/ulltra-logo.png)

Matching explicable para eventos, interfaz en español y envío exclusivamente simulado.

## Identidad visual
El nombre visible es **Ulltra**; el repositorio conserva su nombre `ullraagents`. El [logo original aportado](web/assets/ulltra-logo-original.png) se conserva sin modificar (1600 × 800 px). La interfaz utiliza un [recorte del mismo logo](web/assets/ulltra-logo.png) de 1120 × 360 px, origen x=240/y=220, sin redibujado ni reescalado: elimina el margen para mantener la marca legible, con proporción original y texto alternativo «Ulltra». Solo estas dos rutas PNG se añaden a la lista cerrada de assets del servidor; la CSP no se relaja.

## Arrancar / parar
Requiere Node.js 20+ (verificado con Node 26). Sin dependencias que instalar.

    npm start          # o: node server.mjs
    npm test           # 46 pruebas + verificación de documentos
    npm run reset      # borra runtime-data/ y vuelve a los datos de demo

Abrir http://127.0.0.1:4317. Otro puerto: `PORT=4318 npm start`. Sin persistencia: `PERSIST=0 npm start`.
El estado (borradores, revisiones, envíos simulados) se guarda en `runtime-data/`, que está en `.gitignore`. Cada envío simulado deja un `.eml` en `runtime-data/outbox/`.

## Flujo (v0.2)
**Bandeja de emails → Preparar todos los emails** ejecuta, para cada asistente activo del evento:

1. **Extractor** ([src/extractor.mjs](src/extractor.mjs)): lee sus publicaciones ficticias de LinkedIn, detecta temas off-topic, aísla las que traen instrucciones maliciosas, enmascara DNI/NIE/IBAN e ignora las antiguas.
2. **Calculadora de afinidad** ([src/affinity.mjs](src/affinity.mjs)): top 3 del mismo evento, explicable, con pesos versionados. Si no hay 3 válidos, no rellena.
3. **Sniper de intereses** ([src/sniper.mjs](src/sniper.mjs)): 3 off-topic y 2 on-topic por persona recomendada, cada uno con su fuente (publicación o campo del formulario). Sin fuente → «Pregunta abierta», nunca un dato inventado.
4. **Redactor** ([src/composer.mjs](src/composer.mjs)): email en texto plano para enviar el día anterior.
5. **Revisor independiente** ([src/reviewer.mjs](src/reviewer.mjs)): vuelve a las fichas y publicaciones originales y comprueba 13 puntos (identidades, mezcla de personas/eventos, cantidades, evidencias, DNI/IBAN, contactos, instrucciones, reglas vigentes, ediciones). Resultado: **OK** o **Incidencia** con el motivo exacto.

Después, vosotros: **editar** (re-revisa al guardar), **regenerar**, **resolver incidencia** (solo las revisables por una persona: menos de 3 matches o líneas editadas a mano; las de seguridad exigen regenerar) y **Enviar** (uno a uno o «Enviar todos los OK»). El envío vuelve a pasar el revisor, es idempotente (un email por persona y evento) y es SIMULADO.

Cambiar criterios, dar de baja a alguien o añadir asistentes vuelve a revisar todos los borradores no enviados.

## v0.3 · Conexión explicada y email previsualizable
- **Motivos en ambas direcciones** («Qué te aporta» / «Qué puedes aportarle»), calculados solo con coincidencias reales oferta↔necesidad. Visibles en tarjetas, bandeja y email.
- **Icebreakers con relato**: hechos con fecha (asistió a, charla, logro, viaje, artículo) → «Marcos, vi que estuviste en el congreso de IA aplicada al retail de Lisboa la semana pasada. ¿Qué tal fue?» (fuente: su publicación del …). Sin fuente, el hueco queda **pendiente** e incidencia revisable; las preguntas genéricas solo si se activan en Criterios.
- **Vista previa del destinatario** con foto, nombre, cargo, empresa, motivos e icebreakers, construida desde el mismo texto aprobado (y la misma estructura va en la parte HTML del `.eml`).
- **Foto opcional** aportada por la persona en el formulario (reducida a 256 px en el navegador); si no hay, iniciales. No se descarga nada de LinkedIn.
- **Revisor**: además de cantidades, comprueba variedad (temas repetidos, misma publicación reutilizada, preguntas genéricas) y que los motivos coincidan con las fichas.

Para el experimento con perfiles reales: cada persona pega en «Añadir asistente» sus hechos y publicaciones con fecha y, si quiere, su foto. La app no accede a LinkedIn.

## Datos ficticios incluidos
Tres eventos (Madrid 10 asistentes, Bilbao 6, Valencia 3) con casos trampa a propósito: publicación con *prompt injection* (Javier Ruiz), IBAN en una publicación (Sergio Navarro), perfil sin publicaciones (Andrés Vidal), publicaciones caducadas (Carmen Iglesias), sector fuera de catálogo (Tomás Ortega), baja (Jon Arrieta) y un evento con menos de 3 candidatos (Valencia).

Catálogos: los ~147 sectores de LinkedIn y los tipos de empresa Marca propia · Fabricante · Retail · Operador o distribuidor · Servicios · Sin clasificar ([src/catalog.mjs](src/catalog.mjs)).

## Qué NO hace todavía
- Agentes LLM: sniper y revisor son deterministas (reglas), intercambiables por modelos más adelante.
- LinkedIn real (ni login OIDC ni extracción), SMTP real, despliegue público.

Todos los eventos, contactos @example.test, perfiles, empresas y publicaciones son ficticios.

## Documentación
[Propuesta](docs/PROPUESTA.md) · [Fórmula](docs/FORMULA.md) · [Demo y login](docs/DEMO.md) · [Requisitos](docs/REQUISITOS.md) · [Arquitectura](docs/ARQUITECTURA.md) · [Seguridad](docs/SEGURIDAD.md) · [Backlog](docs/BACKLOG.md) · [Pruebas](docs/PRUEBAS.md) · [Decisiones](docs/DECISIONES.md) · [Contribuir](CONTRIBUTING.md)

La calculadora es nuestra fórmula ([v0.2](docs/FORMULA.md)). Las cantidades 3 off-topic + 2 on-topic POR PERSONA RECOMENDADA son un supuesto visible y editable en Criterios.
