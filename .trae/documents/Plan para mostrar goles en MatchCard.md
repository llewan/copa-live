Sí, correcto. Con una sola llamada al endpoint `/fixtures` de API-Football obtenemos toda la información del partido, incluyendo:
- **Goles y Marcador detallado**
- **Eventos** (Goles, Tarjetas, Sustituciones) con sus minutos exactos.
- **Estadísticas** (aunque a veces estas requieren un endpoint separado dependiendo del plan, los eventos suelen venir incluidos).

Por lo tanto, **no necesitamos hacer llamadas adicionales**. Solo necesitamos asegurarnos de que nuestro backend no esté descartando esa información al transformar los datos antes de enviarlos al frontend.

### Plan de Implementación

1.  **Backend (`api/services/providers/api-football/mappers.ts`)**:
    - Modificar la función `mapFixtureToMatch` (que se usa para la lista de partidos).
    - Actualmente, esta función ignora el campo `events`. La actualizaremos para que extraiga y formatee los eventos (específicamente los goles) igual que lo hace `mapFixtureToMatchDetail`.

2.  **Frontend (`src/components/MatchCard.tsx`)**:
    - Actualizar el diseño de la tarjeta.
    - Leer la propiedad `match.events`.
    - Filtrar los eventos de tipo `GOAL`.
    - Mostrar los autores de los goles y el minuto debajo del nombre de cada equipo.
    - Estilo: Texto pequeño (`text-xs`), color gris suave, para no recargar la tarjeta.

¿Procedemos con estos cambios?
