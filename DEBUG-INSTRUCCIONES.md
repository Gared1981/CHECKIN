# Instrucciones de Debug - Sistema de Check-In

## 🔍 Problema Reportado
- No aparece el nombre del vendedor en el panel
- No aparece la ruta del vendedor
- Los botones de check-in están deshabilitados o no funcionan
- Aparece error: "Error al cargar información del vendedor"

## ✅ Correcciones Aplicadas

### 1. Logs de Depuración Mejorados
Se agregaron logs detallados en:
- `App.tsx`: Muestra información del usuario logueado
- `VendedorPanel.tsx`: Muestra el proceso de carga del vendedor

### 2. Restricciones Eliminadas
- Los botones CHECK-IN y CHECK-OUT están siempre habilitados (si hay lugar de hospedaje)
- No se valida el orden de entrada/salida

### 3. Validaciones de Sesión
- Se verifica que el userId exista antes de cargar el vendedor
- Se muestra la sesión actual en los logs

## 📋 Pasos para Debug

### Paso 1: Abrir la Consola del Navegador
1. Presionar F12 para abrir las DevTools
2. Ir a la pestaña "Console"
3. Recargar la página (F5)

### Paso 2: Verificar Logs de Inicio de Sesión
Buscar en la consola:
```
👤 Usuario logueado: { id: "xxx-xxx-xxx", email: "xxx@terrapesca.com", isAdmin: false }
```

**Verificar:**
- ✅ ¿Aparece el log con tu email?
- ✅ ¿El ID del usuario es un UUID válido?
- ✅ ¿isAdmin es false para vendedores?

### Paso 3: Verificar Carga del Vendedor
Buscar en la consola:
```
🔄 useEffect loadVendedor - userId: "xxx-xxx-xxx"
🔍 Cargando vendedor para userId: "xxx-xxx-xxx"
🔑 Sesión actual: { userId: "xxx-xxx-xxx", email: "xxx@terrapesca.com" }
📦 Resultado de consulta vendedor: { data: {...}, error: null }
✅ Vendedor cargado exitosamente: { id: "...", nombre: "...", ruta: "..." }
```

**Verificar:**
- ✅ ¿El userId es el mismo en todos los logs?
- ✅ ¿La sesión actual tiene el mismo userId?
- ✅ ¿El resultado de la consulta tiene data y NO tiene error?
- ✅ ¿El vendedor se cargó exitosamente con nombre y ruta?

### Paso 4: Si Hay Error en la Consulta
Si ves algo como:
```
❌ Error cargando vendedor: { code: "...", message: "..." }
```

**Copiar y reportar:**
- El código del error
- El mensaje completo del error
- Tu email de inicio de sesión

### Paso 5: Verificar la Interfaz
Una vez que el vendedor se carga exitosamente:
- ✅ El nombre del vendedor debe aparecer en la parte superior
- ✅ La ruta debe aparecer debajo del nombre
- ✅ El error "Error al cargar información del vendedor" debe desaparecer
- ✅ Los botones CHECK-IN y CHECK-OUT deben estar habilitados (verde y azul)

### Paso 6: Intentar un Check-In
1. Llenar el campo "Lugar donde te hospedas"
2. Presionar el botón CHECK-IN
3. Observar los logs en la consola:

```
Iniciando registro... { vendedor: "NOMBRE", tipo: "entrada" }
Coordenadas obtenidas: { lat: xxx, lng: xxx }
Registro a insertar: {...}
Registro insertado exitosamente: {...}
Enviando confirmación por correo...
Correo de confirmación enviado exitosamente
```

**Verificar:**
- ✅ ¿Aparecen todos los logs en orden?
- ✅ ¿El registro se insertó exitosamente?
- ✅ ¿El correo se envió exitosamente?
- ✅ ¿Apareció el mensaje de éxito en pantalla?

## 🐛 Errores Comunes y Soluciones

### Error: "No se pudo identificar al usuario"
**Causa**: El userId es null o undefined
**Solución**:
1. Cerrar sesión
2. Iniciar sesión nuevamente
3. Si persiste, verificar que el usuario existe en la base de datos

### Error: "No se encontró información del vendedor"
**Causa**: El usuario existe pero no tiene un registro en la tabla `vendedores`
**Solución**: Verificar en la base de datos que el usuario tiene un registro en `vendedores` con el `user_id` correcto

### Error: "Error al cargar información del vendedor: Row Level Security"
**Causa**: Los permisos RLS están bloqueando el acceso
**Solución**:
1. Verificar que las políticas RLS permitan a los vendedores ver su propia información
2. Verificar que el `user_id` en la tabla `vendedores` coincida con el `auth.uid()` del usuario

### Error: "Error de Supabase: 42501"
**Causa**: Permisos insuficientes para insertar en `registros_asistencia`
**Solución**: Verificar las políticas RLS en la tabla `registros_asistencia`

## 📊 Verificaciones en Base de Datos

### Verificar Usuario y Vendedor
Ejecutar en SQL:
```sql
SELECT
  u.id as user_id,
  u.email as user_email,
  v.id as vendedor_id,
  v.nombre,
  v.ruta,
  v.email as vendedor_email
FROM auth.users u
LEFT JOIN vendedores v ON v.user_id = u.id
WHERE u.email = 'TU_EMAIL@terrapesca.com';
```

**Resultado esperado:**
- Debe mostrar 1 fila
- `user_id` debe tener un valor
- `vendedor_id` debe tener un valor
- `nombre` y `ruta` deben tener valores

### Verificar Políticas RLS
Ejecutar en SQL:
```sql
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('vendedores', 'registros_asistencia')
ORDER BY tablename, cmd;
```

**Políticas esperadas para `vendedores`:**
- SELECT: Vendedores pueden ver su propia información (auth.uid() = user_id)
- SELECT: Administradores pueden ver todos los vendedores

**Políticas esperadas para `registros_asistencia`:**
- SELECT: Vendedores pueden ver sus propios registros
- SELECT: Administradores pueden ver todos los registros
- INSERT: Vendedores pueden insertar sus propios registros

## 📞 Información para Reportar

Si después de seguir todos los pasos el problema persiste, reportar:

1. **Logs de la consola** (copiar todo lo que aparece)
2. **Email del usuario** que está intentando iniciar sesión
3. **Captura de pantalla** de la interfaz mostrando el error
4. **Resultado de las consultas SQL** de verificación
5. **Navegador y versión** que estás usando

## 🔧 Cambios Técnicos Realizados

### En `App.tsx`
- Agregado log de información del usuario al cargar

### En `VendedorPanel.tsx`
- Agregados logs en `loadVendedor()` para debug
- Agregado log de sesión actual antes de consultar
- Agregada validación de userId antes de cargar vendedor
- Mejorados mensajes de error con información detallada
- Eliminadas restricciones de orden de check-in/check-out
- Variables `puedeHacerCheckIn` y `puedeHacerCheckOut` siempre true

### En Edge Functions
- `confirmar-registro` desplegada y activa
- `notificar-checada-tardia` desplegada y activa

## ⚡ Próximos Pasos

1. Seguir las instrucciones de debug arriba
2. Reportar los logs de la consola
3. Una vez identificado el problema específico, se aplicará la corrección final
