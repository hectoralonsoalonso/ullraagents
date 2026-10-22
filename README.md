# ullraagents

Plataforma de matching para eventos: recomendaciones explicables, temas de conversación y emails revisados con envío humano.

## Estado
Arranque documental; no hay aplicación desplegada, extracción LinkedIn, calculadora implementada ni servicio de correo activo. Las pruebas de este repositorio verifican documentación y estructura de casos, no seguridad de una aplicación todavía inexistente.

## Documentación
- [Propuesta completa](docs/PROPUESTA.md)
- [Fuentes y requisitos](docs/REQUISITOS.md)
- [Arquitectura y contratos](docs/ARQUITECTURA.md)
- [Seguridad y privacidad](docs/SEGURIDAD.md)
- [Backlog](docs/BACKLOG.md)
- [Harness y aceptación](docs/PRUEBAS.md)
- [Decisiones pendientes](docs/DECISIONES.md)
- [Guía de contribución](CONTRIBUTING.md)

## Verificación local
Con Node.js disponible, ejecutar `node scripts/check-docs.mjs`. No requiere instalar dependencias. Comprueba enlaces Markdown relativos, campos/IDs de escenarios y presencia de documentos. No ejecuta los escenarios funcionales.

## Próximo paso
Aportar e inspeccionar la calculadora; confirmar cantidades por match y fuentes/acceso LinkedIn; decidir stack mediante una ADR y empezar el vertical con datos sintéticos. Ningún dato real o secreto debe entrar en Git.
