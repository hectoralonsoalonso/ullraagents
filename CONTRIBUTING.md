# Contribuir

Trabajar en ramas con pull requests y cambios pequeños. No hacer force-push ni merge sin revisión acordada. En repositorio vacío, la rama de arranque podrá ser el primer commit disponible; no asumir que existe main remota.

Antes de código: leer docs/REQUISITOS.md y docs/DECISIONES.md; registrar ADR de stack. Nunca inventar fórmula ni presumir acceso a LinkedIn.

Antes de PR: ejecutar node scripts/check-docs.mjs y git diff --check; revisar cambios por secretos y datos personales. Esas comprobaciones no sustituyen el harness funcional pendiente. No subir .env, perfiles o contactos reales, calculadoras con PII ni dumps.

No activar despliegues, schedulers o email por añadir documentación. Mantener separación entre propuesto, implementado y verificado.
