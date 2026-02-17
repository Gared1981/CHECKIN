# Sistema de Check-In para Vendedores en Calle

## ¿Qué es este sistema?

Sistema de control de asistencia diseñado para **VENDEDORES QUE ANDAN EN LA CALLE** trabajando en rutas foráneas fuera de la oficina.

### Propósito Principal
Controlar y registrar la entrada y salida diaria de los vendedores que están trabajando en sus rutas de venta, permitiendo a la administración:
- Saber a qué hora inician y terminan sus actividades
- Conocer su ubicación geográfica en tiempo real
- Verificar dónde se están hospedando durante sus rutas
- Detectar llegadas tardías automáticamente
- Mantener un historial completo de sus actividades

---

## Cómo Funciona

### Para Vendedores en Calle:

1. **Acceder al sistema** mediante el enlace web desde cualquier celular o computadora
2. **Iniciar sesión** con su email y contraseña personal
3. **Al comenzar el día de trabajo**:
   - Ingresar el lugar donde se hospeda
   - Hacer CHECK-IN (botón verde)
   - El sistema captura automáticamente hora y ubicación GPS
4. **Al terminar el día de trabajo**:
   - Hacer CHECK-OUT (botón azul)
   - El sistema registra hora de salida y ubicación

### Para Administración:

1. **Acceder** con usuario administrador
2. **Ver panel completo** con todos los registros de vendedores
3. **Monitorear** entradas, salidas, ubicaciones y horarios
4. **Recibir notificaciones** automáticas de llegadas tardías
5. **Exportar** información a Excel para reportes

---

## Funcionalidades Principales

### Control de Horarios
- Reloj en tiempo real para cada vendedor
- Horario establecido: entrada antes de 9:05 AM
- Detección automática de llegadas tardías
- Alertas visuales de estado del horario

### Captura de Ubicación
- GPS automático al hacer check-in/check-out
- Registro del lugar de hospedaje
- Coordenadas precisas guardadas en base de datos

### Notificaciones por Email
- Confirmación inmediata al vendedor de cada registro
- Copia a administración de todos los movimientos
- Alerta especial para check-ins tardíos

### Modo Offline
- Funciona sin conexión a internet
- Guarda registros localmente
- Sincroniza automáticamente al recuperar conexión

---

## Información Técnica

### Tecnologías
- Frontend: React + TypeScript + Vite
- Backend: Supabase (Base de datos + Auth + Edge Functions)
- Emails: Resend API
- Hosting: Netlify

### Usuarios Activos
- 5 vendedores en calle
- 2 administradores

### Rutas Foráneas
- F01, F02, F03, F04, F05

---

## Archivos de Documentación

- `PRUEBAS-SISTEMA.md` - Instrucciones detalladas para pruebas
- `DEBUG-INSTRUCCIONES.md` - Guía de resolución de problemas
- `.env` - Variables de entorno (no incluir en control de versiones)

---

## Seguridad

- Autenticación de usuarios mediante Supabase Auth
- Row Level Security (RLS) en base de datos
- Cada vendedor solo ve su información
- Administradores tienen acceso completo

---

## Contacto

Para soporte técnico o preguntas:
- Email: earmenta@terrapesca.com, administracion@terrapesca.com
