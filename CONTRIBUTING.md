# Contribuir

Trabajar en ramas, cambios pequeños y pull requests cuando haya acceso remoto. No force-push ni merge sin revisión acordada. Inspeccionar remoto antes de inicializar rama base vacía.

Leer [requisitos](docs/REQUISITOS.md), [decisiones](docs/DECISIONES.md) y [demo](docs/DEMO.md). Fórmula definida por el proyecto con autorización del usuario; modificar con versión y pruebas, no con pesos ocultos en prompts. No presumir acceso LinkedIn.

Antes de commit: node --test tests/*.test.mjs; node scripts/check-docs.mjs; git diff --check. Revisar secretos y datos personales. No subir .env, tokens, identidad real, perfiles/contactos reales ni dumps. Fixtures y correos solo sintéticos. No añadir dependencias/servicios de producción sin evaluar alternativas y documentar ADR.

Se permite ejecutar demo local 127.0.0.1 sin SMTP. No activar autostart, schedulers, exposición pública o envío real implícitamente. Mantener distinción entre implementado, probado y propuesto; batería planificada no equivale a pruebas ejecutadas.
