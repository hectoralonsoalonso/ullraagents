# Fórmula de afinidad v0.2.0

Cambios respecto a v0.1: (1) el buyer persona admite sectores objetivo opcionales (`buyerSectors`): cada dirección vale la media de «tipo de empresa encaja» y «sector encaja» cuando ambos están declarados; si no, solo el tipo. (2) Afinidad mínima por defecto 30 (antes 35), calibrada con los datos ficticios para que eventos medianos lleguen a 3 recomendaciones. (3) Los intereses ya no se declaran: los obtiene el extractor de publicaciones utilizables (no antiguas, sin instrucciones maliciosas).

Implementada en [motor](../src/affinity.mjs). Diseño inicial definido por nosotros por autorización del usuario, no derivado de una calculadora ausente. No es probabilidad de éxito ni modelo de compatibilidad personal. Todo el perfil de matching es sintético y excluye identidad/contacto.

## Entradas y elegibilidad
IDs opacos, eventId, status (active/withdrawn), synthetic:true, offers, needs, buyerTypes, companyType e interests. Listas de IDs de catálogo, no lenguaje libre ni scraping. La API limita las listas al catálogo cerrado; el motor valida formato y rechaza campos extra, correo y perfiles sin marcador sintético. Elegibilidad: persona distinta, mismo evento, ambos activos. Baja, otro evento o autorrecomendación => exclusión sin puntuar. El top 3 no se rellena con excluidos.

## Componentes observados, entre 0 y 1
- **O, 40%**: oferta de A cubre necesidades de B = tamaño de intersección(offersA,needsB) / tamaño de needsB.
- **N, 35%**: oferta de B cubre necesidades de A = tamaño de intersección(offersB,needsA) / tamaño de needsA.
- **B, 20%**: media de los dos encajes buyer persona. Cada dirección vale 1 si el tipo de empresa del otro está entre sus buyerTypes, 0 si no. Solo observado cuando se conocen ambas direcciones.
- **I, 5%**: intereses neutrales compartidos = intersección / unión (Jaccard). No datos sensibles ni popularidad, cargo, edad, género, correo o identidad real.

Pesos no negativos deben sumar 100. Se pueden modificar mediante ajustes; nuevo guardado genera versión demo incremental, invalida revisiones y exige regenerar. Se puede poner I=0 y repartir su peso entre los demás.

## Ausencia no es incompatibilidad
Lista ausente, null o vacía = desconocida en esta v0.1; no significa “declara no necesitar nada”. Dos listas presentes no vacías sin coincidencias = 0 observado.
Cada componente ausente se excluye del denominador, no se reemplaza por 0:

    cobertura = suma de pesos de componentes observados
    afinidad = 100 × suma(peso × componente observado) / cobertura

Si cobertura=0 => score:null. Por defecto cobertura mínima=60 y afinidad mínima=30. Cobertura insuficiente => INSUFFICIENT_DATA aunque la puntuación parcial sea alta; puntuación observada baja => BELOW_THRESHOLD. Siempre mostrar puntuación JUNTO a cobertura. La renormalización puede elevar resultados con campos ausentes: la cobertura visible y su umbral evitan presentar esa cifra como certeza. Futuro: diferenciar “ninguna necesidad declarada” mediante un estado explícito, no reutilizar [].

## Orden, límites y explicaciones
Orden: score mostrado a dos decimales descendente, cobertura descendente, ID opaco lexicográfico ascendente. El umbral usa valor previo al redondeo. ID solo desempata, no aporta afinidad. Hasta tres candidatos elegibles; si faltan, incidencia INSUFFICIENT_MATCHES. Cada resultado conserva versión, componentes, peso, estado observado/ausente y coincidencias de catálogo. La recomendación es direccional (40/35), no necesariamente recíproca.

## Ejemplos reproducibles
[Fixtures](../tests/fixtures/participants.json) y [tests](../tests/affinity.test.mjs):
- demo-a → demo-b: O=N=B=I=1; puntuación 100, cobertura 100.
- demo-a → demo-c: O=0.5; N=1; B=0.5; I=1/3 => 66.67 con cobertura 100.
- demo-c → demo-a: 69.17, por la dirección de los pesos.
- demo-a → demo-d: faltan intereses; (40+35+20)/95×100 = 100, cobertura 95, no 95 puntos de incompatibilidad.
- Solo B e I observados: cobertura 25; incluso score=100 queda excluido por datos insuficientes.

## Límite de esta implementación
Las coincidencias son exactas sobre etiquetas ficticias, no embeddings ni inferencias semánticas. Umbrales iniciales configurables para explorar el mockup; no validados todavía contra utilidad humana real. Seguridad de aplicación y calidad de negocio requieren más pruebas antes de producción.
