/*
  # Corregir política RLS de administradores para tabla registros_asistencia

  1. Cambios
    - Eliminar la política anterior que consultaba auth.users (causaba error de permisos)
    - Crear nueva política que usa auth.jwt() para verificar el email
    - Esto evita el error "permission denied for table users"

  2. Seguridad
    - Los vendedores solo ven sus propios registros
    - Los administradores ven todos los registros usando auth.jwt()
*/

-- Eliminar la política problemática
DROP POLICY IF EXISTS "Administradores pueden ver todos los registros" ON registros_asistencia;

-- Crear nueva política usando auth.jwt() en lugar de consultar auth.users
CREATE POLICY "Administradores pueden ver todos los registros"
  ON registros_asistencia
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      'earmenta@terrapesca.com',
      'administracion@terrapesca.com'
    )
  );