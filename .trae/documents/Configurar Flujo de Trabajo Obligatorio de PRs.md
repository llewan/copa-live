Entendido. Voy a configurar el entorno para cumplir con ambos requisitos:
1.  **Regla de Memoria**: Configuraré mi memoria para que siempre utilice PRs hacia `main`.
2.  **Git Hooks (Husky)**: Configuraré `husky` y `lint-staged` para que **antes de cada commit** se ejecuten automáticamente:
    *   Linter (`eslint`) solo en archivos modificados.
    *   Type Check (`tsc`) en todo el proyecto.
    *   Unit Tests.

### Plan de Implementación

1.  **Configurar Memoria del Agente**:
    *   Guardar la regla: *"Workflow: Always create a new branch and submit a Pull Request to `main`. Never push directly."*

2.  **Instalar Dependencias**:
    *   Instalar `husky` y `lint-staged` como dependencias de desarrollo.

3.  **Configurar Scripts y Hooks**:
    *   Añadir script `test` al `package.json` (apuntando a `server/services/.../client.test.ts`).
    *   Configurar `lint-staged` en `package.json` para ejecutar linter en archivos staged.
    *   Inicializar Husky y crear el hook `pre-commit` que ejecute:
        ```bash
        npx lint-staged
        npm run check
        npm run test
        ```

4.  **Aplicar y Verificar**:
    *   Crear una rama `feat/setup-git-hooks`.
    *   Hacer commit de la configuración (esto probará que el hook funciona).
    *   Hacer push y crear el PR a `main` (cumpliendo la nueva regla).

¿Procedo con esta configuración?