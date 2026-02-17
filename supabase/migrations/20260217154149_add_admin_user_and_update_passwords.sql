/*
  # Agregar usuario administrativo y actualizar contraseñas

  1. Cambios
    - Crear nuevo usuario administrativo: mh@terrapesca.com con contraseña: mh123
    - Actualizar contraseñas de todos los usuarios existentes con iniciales + números simples:
      * administracion@terrapesca.com: admin123
      * earmenta@terrapesca.com: ea123
      * ianaya@terrapesca.com: ia123
      * jgastelum@terrapesca.com: jag123
      * jlanzarin@terrapesca.com: jsl123
      * jmarquez@terrapesca.com: jgm123
      * jvaldez@terrapesca.com: jmv123
  
  2. Notas
    - Las contraseñas se almacenan usando bcrypt para seguridad
    - El nuevo usuario mh@terrapesca.com será administrador
*/

-- Crear el nuevo usuario administrativo mh@terrapesca.com si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mh@terrapesca.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'mh@terrapesca.com',
      crypt('mh123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;

-- Actualizar contraseña de administracion@terrapesca.com
UPDATE auth.users
SET 
  encrypted_password = crypt('admin123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'administracion@terrapesca.com';

-- Actualizar contraseña de earmenta@terrapesca.com
UPDATE auth.users
SET 
  encrypted_password = crypt('ea123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'earmenta@terrapesca.com';

-- Actualizar contraseña de ianaya@terrapesca.com
UPDATE auth.users
SET 
  encrypted_password = crypt('ia123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'ianaya@terrapesca.com';

-- Actualizar contraseña de jgastelum@terrapesca.com
UPDATE auth.users
SET 
  encrypted_password = crypt('jag123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'jgastelum@terrapesca.com';

-- Actualizar contraseña de jlanzarin@terrapesca.com
UPDATE auth.users
SET 
  encrypted_password = crypt('jsl123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'jlanzarin@terrapesca.com';

-- Actualizar contraseña de jmarquez@terrapesca.com
UPDATE auth.users
SET 
  encrypted_password = crypt('jgm123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'jmarquez@terrapesca.com';

-- Actualizar contraseña de jvaldez@terrapesca.com
UPDATE auth.users
SET 
  encrypted_password = crypt('jmv123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'jvaldez@terrapesca.com';
