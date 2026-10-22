# Seguridad y privacidad por diseño

Propuesta técnica; no constituye auditoría legal ni garantía de cumplimiento. Antes de datos reales: revisar base y alcance de uso, información al participante, retención, proveedores y ejercicio de derechos con responsable competente.

## Permisos mínimos propuestos
| Componente | Puede leer | Puede escribir | No permitido |
|---|---|---|---|
| Extractor | Entrada del evento y fuente autorizada | Datos estructurados y evidencia mínima | Correo, otros eventos, envío |
| Clasificador | Catálogo versionado y empresa | Categoría o pendiente | Inventar etiquetas, editar catálogo |
| Motor scoring | Perfiles sin email y reglas | Puntuación y explicación | Alterar pesos o fuentes |
| Sniper/redactor | Pareja concreta y evidencias vigentes | Propuestas/borradores | Bóveda, conectores generales, enviar |
| Revisor | Borrador y fuentes de pareja | Resultado de revisión | Autoaprobar envío o editar políticas |
| Censor | Salida limitada | Salida filtrada/incidencia | Copiar datos completos a logs |
| Servicio envío | Contacto mínimo y autorización vigente | Estado/recibo | Modificar contenidos o enviar por OK automático |
| Operador humano | Evento según rol | Editar/revisar/enviar permitido | Acceso global por defecto |

Aplicar política en herramientas, carpetas, almacenamiento y conectores; no solo prompts. Denegar por defecto. Rutas/control de traversal, IDs cruzados, cachés, índices y exportaciones deben respetar evento y rol.

## Datos no confiables
Campos libres, perfiles, publicaciones y tickets no pueden cambiar instrucciones, permisos, destinatarios ni herramientas. Extraer a esquema cerrado; separar contenido de políticas; bloquear acciones fuera del contrato. No ejecutar código/comandos/URLs recibidos de un participante.

## Censor
DNI/NIE, IBAN y reglas configurables; detectar formas espaciadas/ofuscadas, evitar falsos positivos mediante contexto/validadores cuando aplique. Contemplar límites de detección. Cubrir salidas UI, prompts a terceros cuando corresponda, logs, trazas y exportaciones. Incidencia segura en vez de copiar el dato detectado. Correo solo visible donde sea necesario para contacto y envío.

## Evidencia y ciclo de vida
Fechas y procedencia; fuente revocada, caducada o contradictoria => revalidar/bloquear/regenerar. Definir retención y borrado incluyendo derivados y copias. No inferir información sensible; intereses neutros sin premisas de respaldo. No registrar transcripciones completas por defecto.

## Envío
Acción humana autenticada, autorización sobre versión inmutable, revalidación de baja/cancelación/pertenencia y deduplicación. Sin secretos en Git, fixtures, logs o issues. Pruebas con datos sintéticos. No se habilitan conectores ni correo en este bootstrap.
