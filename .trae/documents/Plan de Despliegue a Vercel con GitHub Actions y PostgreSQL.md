Aquí tienes el plan detallado de ejecución:

## Paso 1: Migración a PostgreSQL (Cloud-First)
Modificaremos el código para que la aplicación funcione exclusivamente con PostgreSQL (conectándose a la nube desde local y prod).
1.  **Modificar `api/db.ts`**: Reemplazar la lógica de SQLite (`better-sqlite3`) por `pg`. Implementar un Pool de conexiones robusto que use `process.env.DATABASE_URL`.
2.  **Actualizar `api/init_db.ts`**: Reescribir las sentencias SQL para que sean compatibles con PostgreSQL (ej. usar `SERIAL` en lugar de `AUTOINCREMENT`, `TIMESTAMPTZ`, etc.).
3.  **Limpieza**: Eliminar dependencias de SQLite (`better-sqlite3`) y sus archivos temporales.

## Paso 2: Infraestructura de Tests
Configuraremos el entorno para asegurar la calidad del código.
1.  **Instalar Vitest**: `npm install -D vitest`.
2.  **Configurar Scripts**: Añadir `"test": "vitest run"` al `package.json`.
3.  **Verificación**: Ejecutar una prueba simple para confirmar que el runner funciona.

## Paso 3: Pipeline de Integración Continua (CI/CD)
Crearemos el archivo `.github/workflows/deploy.yml` que automatizará el proceso:
1.  **Activador**: Push a la rama `main`.
2.  **Fase de Validación**:
    -   `npm ci` (Instalación limpia).
    -   `npm run lint` (Estilo de código).
    -   `npm run check` (Tipos TypeScript).
    -   `npm run test` (Tests unitarios).
3.  **Fase de Despliegue**:
    -   Se ejecuta **solo** si la validación pasa.
    -   Comando: `vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}`.

## Paso 4: Instrucciones de Puesta en Marcha
Al finalizar los cambios de código, te guiaré para:
1.  Crear el repositorio en GitHub y subir el código.
2.  Crear el proyecto en Vercel y generar la Base de Datos (Postgres).
3.  Obtener la `DATABASE_URL` y pegarla en tu `.env` local.
4.  Configurar los secretos (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) en GitHub.

¿Comenzamos con el Paso 1 (Código de Base de Datos)?