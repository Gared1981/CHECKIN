# Pruebas del Sistema de Check-In para Vendedores en Calle

## 📍 Descripción del Sistema
Sistema de control de asistencia diseñado específicamente para **VENDEDORES QUE ANDAN EN LA CALLE** trabajando en rutas foráneas. El sistema permite:
- Registrar entrada (check-in) al iniciar actividades en calle
- Registrar salida (check-out) al finalizar actividades del día
- Capturar ubicación GPS del lugar donde se encuentran
- Registrar lugar de hospedaje durante su ruta
- Control de horarios y detección de llegadas tardías
- Notificaciones automáticas por correo

## ✅ Cambios Realizados

### 1. Edge Function de Confirmación
- **Desplegada**: `confirmar-registro` (ACTIVA)
- **Función**: Envía correo de confirmación al vendedor cada vez que registra entrada o salida
- **Destinatarios**:
  - Principal: Email del vendedor
  - CC: earmenta@terrapesca.com, administracion@terrapesca.com

### 2. Restricciones Removidas (Temporal para Pruebas)
- ❌ Ya NO se valida que el check-in sea antes de check-out
- ❌ Ya NO se valida que el check-out sea después de check-in
- ✅ Se pueden hacer múltiples check-ins o check-outs seguidos
- ✅ Los botones están siempre habilitados (si hay lugar de hospedaje)

### 3. Debug Mejorado
- Se agregaron console.logs en cada paso del proceso:
  - Inicio de registro
  - Obtención de coordenadas GPS
  - Inserción en base de datos
  - Envío de correo de confirmación
  - Envío de notificación de tardío (si aplica)

### 4. Sistema de Horario
- El reloj muestra en tiempo real:
  - 🟢 Verde = Horario válido (antes de 9:05 AM)
  - 🔴 Rojo = Fuera de horario (después de 9:05 AM)
- Los registros después de 9:05 AM se marcan como TARDÍOS
- Se envía notificación adicional a administración para check-ins tardíos

## 📋 Cómo Probar

### Paso 1: Abrir la Aplicación
1. Ir a la URL de la aplicación
2. Iniciar sesión con cualquiera de estos vendedores:
   - ianaya@terrapesca.com
   - jlanzarin@terrapesca.com
   - jgastelum@terrapesca.com
   - jmarquez@terrapesca.com
   - jvaldez@terrapesca.com

### Paso 2: Hacer un Check-In
1. Llenar el campo "Lugar donde te hospedas" (OBLIGATORIO)
2. Opcionalmente agregar notas
3. Presionar el botón "CHECK-IN" (verde)
4. **Observar:**
   - Debe aparecer mensaje de éxito verde
   - Si es tardío, dirá "(TARDÍO)" en el mensaje
   - El registro debe aparecer en el historial abajo

### Paso 3: Verificar Consola del Navegador
Abrir las DevTools (F12) y ver la pestaña Console:
```
✅ Iniciando registro...
✅ Coordenadas obtenidas: {lat: xxx, lng: xxx}
✅ Registro a insertar: {...}
✅ Registro insertado exitosamente: {...}
✅ Enviando confirmación por correo...
✅ Correo de confirmación enviado exitosamente
```

### Paso 4: Verificar Correos
1. **Vendedor** debe recibir:
   - Correo de confirmación con título "🟢 Check-In Confirmado - [Nombre]"
   - Contiene todos los detalles del registro

2. **Administradores** (earmenta@terrapesca.com, administracion@terrapesca.com):
   - Reciben CC del correo de confirmación
   - Si el check-in fue tardío, reciben correo adicional de alerta

### Paso 5: Hacer un Check-Out (Opcional)
1. Presionar el botón "CHECK-OUT" (azul)
2. Verificar mismo flujo que check-in

## 🐛 Si Hay Errores

### Error en Console
Si aparece error en la consola, copiar el mensaje completo, incluye:
- Mensaje de error
- Tipo de error (Supabase, fetch, etc.)
- Stack trace

### Error en Pantalla
Si aparece mensaje de error rojo:
- Copiar el texto del error
- Verificar que se llenó el campo "Lugar donde te hospedas"

### No Llega Correo
1. Verificar spam/correo no deseado
2. Verificar que el correo del vendedor sea correcto en la BD
3. Revisar consola del navegador para ver si hubo error al enviar

## 📊 Edge Functions Disponibles

| Nombre | Estado | Descripción |
|--------|--------|-------------|
| confirmar-registro | ✅ ACTIVE | Envía confirmación al vendedor |
| notificar-checada-tardia | ✅ ACTIVE | Notifica a admins de check-ins tardíos |
| enviar-instrucciones | ✅ ACTIVE | Envía instrucciones del sistema |
| test-email | ✅ ACTIVE | Prueba de correos |

## 🔍 Vendedores de Prueba

| Nombre | Ruta | Email |
|--------|------|-------|
| IRÁN LIZANDRO ANAYA TORRES | F02 | ianaya@terrapesca.com |
| JESÚS SALVADOR LANZARIN FERRÉ | F04 | jlanzarin@terrapesca.com |
| JORGE ABRAHAM GASTELUM SOTO | F03 | jgastelum@terrapesca.com |
| JOSÉ GILBERTO MÁRQUEZ FLORES | F01 | jmarquez@terrapesca.com |
| JUAN MIGUEL VALDEZ GASTÉLUM | F05 | jvaldez@terrapesca.com |

La contraseña es la misma que se configuró al crear los usuarios.
