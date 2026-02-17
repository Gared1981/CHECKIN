/*
  # Actualizar contraseñas de vendedores

  1. Cambios
    - Actualizar contraseñas de todos los vendedores con nuevas credenciales más seguras:
      * ianaya@terrapesca.com: Iran2026!
      * jlanzarin@terrapesca.com: Jesus2026!
      * jgastelum@terrapesca.com: Jorge2026!
      * jmarquez@terrapesca.com: Jose2026!
      * jvaldez@terrapesca.com: Juan2026!
  
  2. Notas
    - Las contraseñas se almacenan usando bcrypt para seguridad
    - Todas las contraseñas siguen el patrón: [Nombre]2026!
*/

-- Actualizar contraseña de ianaya@terrapesca.com (Irán)
UPDATE auth.users
SET 
  encrypted_password = crypt('Iran2026!', gen_salt('bf')),
  updated_at = now()
WHERE email = 'ianaya@terrapesca.com';

-- Actualizar contraseña de jlanzarin@terrapesca.com (Jesús)
UPDATE auth.users
SET 
  encrypted_password = crypt('Jesus2026!', gen_salt('bf')),
  updated_at = now()
WHERE email = 'jlanzarin@terrapesca.com';

-- Actualizar contraseña de jgastelum@terrapesca.com (Jorge)
UPDATE auth.users
SET 
  encrypted_password = crypt('Jorge2026!', gen_salt('bf')),
  updated_at = now()
WHERE email = 'jgastelum@terrapesca.com';

-- Actualizar contraseña de jmarquez@terrapesca.com (José)
UPDATE auth.users
SET 
  encrypted_password = crypt('Jose2026!', gen_salt('bf')),
  updated_at = now()
WHERE email = 'jmarquez@terrapesca.com';

-- Actualizar contraseña de jvaldez@terrapesca.com (Juan)
UPDATE auth.users
SET 
  encrypted_password = crypt('Juan2026!', gen_salt('bf')),
  updated_at = now()
WHERE email = 'jvaldez@terrapesca.com';
