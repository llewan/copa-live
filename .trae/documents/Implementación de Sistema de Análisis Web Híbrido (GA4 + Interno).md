# Plan Definitivo: Conexión con Google Analytics 4

¡Exacto! Tiene toda la razón. **Google Analytics (analytics.google.com)** es el "frontend" más potente y completo que existe para visualizar estos datos. No tiene sentido reinventar la rueda construyendo dashboards en la aplicación cuando Google ya nos ofrece todo eso gratis (mapas, gráficos en tiempo real, flujos de usuarios, etc.).

## Nueva Estrategia Simplificada
Nuestro trabajo se reducirá exclusivamente a **conectar la aplicación** con Google Analytics para enviarle los datos. Usted consultará todos los informes directamente en la web de Google.

### Pasos de Implementación

1.  **Instalación del "Emisor" (`react-ga4`)**
    - Instalaremos la librería oficial ligera que sirve de puente entre su App y Google.

2.  **Configuración de la "Antena" (`src/lib/analytics.ts`)**
    - Crearemos un archivo de configuración donde pondrá su `MEASUREMENT_ID` (el código que le da Google).
    - Definiremos funciones simples para reportar: "Alguien vio esta página" o "Alguien hizo clic aquí".

3.  **Rastreo Automático (`AnalyticsTracker.tsx`)**
    - Crearemos un componente invisible que detecta cada vez que el usuario cambia de pantalla en la app y avisa a Google: "El usuario ahora está en /partido/123".

4.  **Cumplimiento Legal (`CookieConsent.tsx`)**
    - Para poder usar Google Analytics legalmente, debemos preguntar al usuario. Añadiremos una barra inferior simple: "Usamos cookies para mejorar la experiencia. [Aceptar]".
    - Solo si aceptan, activamos la conexión con Google.

5.  **Eventos Clave**
    - Configuraremos avisos específicos cuando ocurran cosas importantes:
        - **Login/Registro**: Para saber cuántos usuarios se convierten en registrados.
        - **Ver Partido**: Para saber qué partidos son los más populares.

## Resultado Final
- **En su código**: Una integración limpia, ligera y profesional.
- **En su navegador**: Entrará a `analytics.google.com` y verá todos los gráficos, mapas y alertas que solicitó inicialmente, sin esfuerzo de desarrollo extra.
