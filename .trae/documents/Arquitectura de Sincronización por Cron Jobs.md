# Implementación de Sincronización con Vercel Cron

## 1. Nueva Ruta para Cron Jobs
Crear el archivo `server/routes/cron.ts` con dos endpoints:
- `GET /daily`: Ejecuta la carga inicial de partidos (`getMatches`).
- `GET /live`: Ejecuta la sincronización inteligente (`syncLiveMatches`).
  - **Optimización**: Antes de llamar a la API externa, verificará en la DB si existen partidos con estado `IN_PLAY`, `PAUSED` o `SCHEDULED` (en los próximos 20 min). Si no hay, retorna 200 OK sin consumir cuota.

## 2. Integración de Rutas
Modificar `server/routes.ts` para montar las rutas de cron bajo `/api/cron`.

## 3. Configuración de Vercel
Crear/Modificar `vercel.json` en la raíz del proyecto para definir los cron jobs:
- **Daily**: `0 10 * * *` (10:00 AM UTC, ajustable).
- **Live**: `*/10 * * * *` (Cada 10 minutos).

## 4. Seguridad
Implementar un middleware simple o chequeo en los endpoints de cron para validar `process.env.CRON_SECRET` (si está configurado) o permitir acceso público controlado si es necesario para pruebas iniciales, pero recomendando la protección.

## 5. Limpieza (Opcional pero recomendada)
Revisar `server/routes/matches.ts` para asegurar que las peticiones de los usuarios (`GET /`) ya no disparen actualizaciones a la API externa, confiando plenamente en la DB mantenida por los Cron Jobs.
