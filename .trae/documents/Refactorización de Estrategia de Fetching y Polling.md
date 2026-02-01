# Nueva Estrategia de Sincronización de Partidos

Sí, es **totalmente posible** realizar lo que pides con la API secundaria (**API-Football**). Esta API proporciona exactamente los datos que necesitas: minutos exactos, goleadores y estado en tiempo real.

A continuación, presento el plan técnico para implementar tu lógica:

## 1. Carga Inicial (Optimización de Llamadas)
Modificaremos la lógica principal en `footballService.ts` para reducir el consumo de la API:
- **Verificación en DB**: Al cargar el sistema (o consultar el día de hoy), revisaremos primero la base de datos local.
- **Lógica de "Llenado" (Si la DB está vacía)**:
  - Si no hay registros para hoy, consultaremos la **API Primaria** (Football-Data) solicitando el calendario desde **Hoy hasta Hoy + 10 días**.
  - Guardaremos todos estos partidos en la base de datos de una sola vez.
- **Uso de Caché**: Si ya existen partidos en la DB, usaremos esos datos directamente sin consultar ninguna API externa en este paso.

## 2. Sistema de Polling "Inteligente" (Live Updates)
Implementaremos una nueva función `syncLiveMatches` en el servicio que actuará bajo demanda:
- **Condición de Activación**:
  - Consultará la DB para ver si hay partidos con estado **"EN JUEGO"** (IN_PLAY, PAUSED) o que estén programados para empezar en los próximos **5 minutos**.
- **Ejecución del Polling**:
  - **Solo si se cumple la condición anterior**, se hará una petición a la **API Secundaria** (API-Football) solicitando *todos* los partidos de hoy para nuestras 4 ligas.
  - **Actualización Granular**:
    - Se recorrerán los resultados y se actualizará en la DB:
      - Estado del partido (e.g., IN_PLAY, FINISHED).
      - Minuto exacto (`elapsed`).
      - Marcador temporal.
      - **Goles y Eventos**: Se borrarán/reinsertarán los eventos de goles para asegurar que tenemos los autores y minutos exactos actualizados.
  - **Detención Automática**: Si no hay partidos activos ni por empezar, el sistema no hará ninguna llamada a la API secundaria, ahorrando recursos.

## 3. Implementación Técnica
- **`api/services/footballService.ts`**:
  - Refactorizar `getMatches` para implementar la lógica de los 10 días.
  - Crear el método `checkAndSyncLiveMatches`.
- **`api/repositories/matchRepository.ts`**:
  - Asegurar que tenemos métodos eficientes para buscar "partidos activos" (`getLiveOrUpcomingMatches`).
  - Optimizar la actualización de eventos (goles).

Este enfoque cumple estrictamente con tu requerimiento: **minimizar llamadas cuando no son necesarias y maximizar la precisión cuando hay acción en vivo.**