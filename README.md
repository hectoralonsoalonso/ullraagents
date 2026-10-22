# ullraagents · demo local

Matching explicable para eventos, interfaz en español y envío exclusivamente simulado.

## Arrancar / parar
Requiere Node.js con módulos ESM y node:test (verificado con Node 26). No requiere instalar dependencias.

    node server.mjs

Abrir http://127.0.0.1:4317. Otro puerto: PORT=4318 node server.mjs.
Parar: Ctrl+C en la terminal del servidor. Si se lanzó con el gestor de procesos de OpenClaw, detener solo esa sesión desde el gestor; no reiniciar el Gateway.

## Qué funciona
- Dos eventos y 18 asistentes ficticios, alta de eventos y participantes con catálogo cerrado.
- Top 3 explicable con fórmula v0.1, cobertura, pesos editables y versiones.
- Sniper/redactor por plantillas y evidencias sintéticas, no agentes LLM reales.
- Revisor determinista, invalidación al editar/cambiar reglas, envío manual SIMULADO e idempotencia.
- Filtro conservador DNI/NIE/IBAN y controles de API locales.
- Propuesta accesible desde la interfaz. No hay apartado global de preparación/incidencias/envíos en el panel; sí revisión específica de cada borrador.

Todos los eventos, contactos @example.test, perfiles, empresas e intereses son ficticios. No hay SMTP, scraping, conexión LLM ni llamadas externas. Estado solo en memoria: reiniciar restaura la demo.
**LinkedIn real no configurado**: ningún botón simula una autenticación real. El único dato real previsto será la identidad del operador por OIDC, cuando se configuren app, callback y credenciales por vía segura. No concederá acceso automático a publicaciones/cargo/empresa.

## Comprobaciones
- node --test tests/*.test.mjs: pruebas reales de motor, API y controles demo.
- node scripts/check-docs.mjs: documentos/enlaces y catálogo de 24 escenarios, no ejecución de todas las políticas futuras.
- git diff --check.

## Documentación
[Propuesta](docs/PROPUESTA.md) · [Fórmula](docs/FORMULA.md) · [Demo y login](docs/DEMO.md) · [Requisitos](docs/REQUISITOS.md) · [Arquitectura](docs/ARQUITECTURA.md) · [Seguridad](docs/SEGURIDAD.md) · [Backlog](docs/BACKLOG.md) · [Pruebas](docs/PRUEBAS.md) · [Decisiones](docs/DECISIONES.md) · [Contribuir](CONTRIBUTING.md)

La calculadora adjunta deja de ser dependencia: el usuario ha autorizado definir nuestra fórmula. Las cantidades 3 off-topic + 2 on-topic POR MATCH siguen siendo un supuesto visible y editable. No hay despliegue público ni publicación GitHub realizada por esta demo.
