# Implementación de Estrategia Híbrida de Datos de Partidos

Esta estrategia optimiza el rendimiento y reduce el uso de la API almacenando los partidos finalizados en la base de datos local (SQLite/Postgres) y consultando la API solo para datos en vivo o futuros.

## 1. Actualización del Esquema de Base de Datos
Mejoraremos la tabla `matches` para almacenar toda la información necesaria que ahora viene de la API, permitiendo que la UI funcione igual con datos locales.

**Nuevas Columnas en `matches`:**
- Identificadores y Logos: `home_team_id`, `away_team_id`, `home_team_crest`, `away_team_crest`.
- Competición: `competition_emblem`.
- Detalles: `stage`, `group_name` (para evitar conflictos con keyword `GROUP`).

## 2. Creación de Capa de Repositorio
Crearemos `api/repositories/matchRepository.ts` para manejar la interacción con la base de datos, separando SQL de la lógica de negocio.

**Funciones Clave:**
- `upsertMatch(match)`: Inserta o actualiza un partido (útil para guardar resultados finales).
- `getMatchesByDate(date)`: Recupera partidos de un día específico desde la BD.
- `getMatchById(id)`: Recupera un partido individual (para la vista de detalle).

## 3. Lógica Híbrida en el Servicio (`footballData.ts`)
Modificaremos `getMatches` para decidir inteligentemente la fuente de datos:

**Flujo de Trabajo:**
1.  **Partidos Pasados (Fecha < Hoy)**:
    -   Consultar primero la Base de Datos.
    -   Si no hay datos, consultar la API, guardar en BD ("cache warm-up") y devolver.
    -   Si hay datos, devolver directamente desde BD (ahorra llamadas API).
2.  **Partidos Hoy/Futuro (Fecha >= Hoy)**:
    -   Consultar siempre la API para tener datos en tiempo real.
    -   Identificar partidos con estado `FINISHED` en la respuesta.
    -   Guardar asíncronamente los partidos finalizados en la BD para futuras consultas históricas.

## 4. Verificación
- Ejecutar migración de esquema.
- Probar carga de partidos pasados (debe llenar la BD).
- Verificar que las segundas consultas a fechas pasadas sean rápidas y no toquen la API (logs).
- Verificar que los partidos de hoy sigan viniendo de la API.
