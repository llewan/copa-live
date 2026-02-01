# Plan de Implementación: CopaLive

Perfecto, vamos con **CopaLive**. Procederé con los siguientes cambios:

## 1. Actualizar Identidad de Marca (Branding)
*   **Archivo `package.json`**: Cambiar el nombre del proyecto a `copa-live`.
*   **Archivo `index.html`**: Actualizar el título principal a `CopaLive - Resultados de Fútbol en Vivo`.
*   **Archivo `src/components/SEO.tsx`**: Establecer "CopaLive" como el nombre por defecto del sitio y ajustar la descripción para incluir "Mundial, Champions y Premier".

## 2. Preparar Espacios Publicitarios (Monetización)
*   **Crear `src/components/AdContainer.tsx`**: Un componente contenedor flexible para futuros anuncios (AdSense, banners de afiliados, etc.). Incluirá una etiqueta visual "Publicidad" discreta en modo desarrollo.
*   **Actualizar `src/components/Layout.tsx`**: Insertar el `AdContainer` en la parte superior e inferior de la vista principal.

## 3. Verificación
*   Confirmar que la aplicación se compila y ejecuta correctamente con los nuevos cambios.
*   Verificar que el título de la pestaña del navegador muestra "CopaLive".

¿Listo para ejecutar?