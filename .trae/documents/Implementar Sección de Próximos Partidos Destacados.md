Voy a implementar una nueva sección **"Próximos Partidos"** en el Dashboard que mostrará los encuentros futuros de los equipos favoritos del usuario.

### 1. Backend: Nuevo Endpoint de Próximos Partidos
*   **Servicio (`api/services/footballData.ts`)**:
    *   Crearé una función `getUpcomingMatches(teamNames: string[])` que:
        *   Obtendrá los partidos programados para los próximos 14 días.
        *   Filtrará los resultados para incluir solo aquellos donde juegue alguno de los equipos favoritos (usando coincidencia de nombres, consistente con la lógica actual).
        *   Limitará el resultado a los 4 partidos más próximos.
*   **Ruta (`api/routes/matches.ts`)**:
    *   Añadiré el endpoint `GET /upcoming` que aceptará una lista de nombres de equipos (`?teams=Arsenal,Real Madrid...`).

### 2. Frontend: Nuevo Componente `UpcomingMatches`
*   Crearé el componente en `src/components/UpcomingMatches.tsx`.
*   **Lógica**:
    *   Obtendrá los equipos seguidos desde `usePreferenceStore`.
    *   Si no hay equipos seguidos, el componente no se mostrará.
    *   Consultará el nuevo endpoint del backend.
*   **Diseño ("Divertido y Chulo")**:
    *   Usaré un diseño de tarjetas destacadas con gradientes y sombras suaves.
    *   Mostrará los logos de los equipos, la fecha/hora y el estadio.
    *   Incluirá una etiqueta de "Próximamente" animada.

### 3. Integración y Traducción
*   **Dashboard (`src/pages/Dashboard.tsx`)**: Insertaré el componente `UpcomingMatches` justo debajo del contador del Mundial.
*   **Traducciones (`src/locales`)**: Agregaré los textos necesarios en Inglés, Español y Francés (ej. "Tus Próximos Partidos", "En X días").

### Pasos de Implementación
1.  Modificar `api/services/footballData.ts` y `api/routes/matches.ts`.
2.  Crear `src/components/UpcomingMatches.tsx`.
3.  Agregar traducciones en `src/locales/*.json`.
4.  Integrar el componente en `src/pages/Dashboard.tsx`.
