/*
  # Add semana_laboral column to registros_asistencia
  
  1. Changes
    - Add `semana_laboral` column to `registros_asistencia` table
      - Type: integer
      - Not null with default value 1
      - Represents the work week number of the year
  
  2. Purpose
    - Track which work week each check-in/check-out belongs to
    - Allows filtering and reporting by work week
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registros_asistencia' AND column_name = 'semana_laboral'
  ) THEN
    ALTER TABLE registros_asistencia 
    ADD COLUMN semana_laboral integer NOT NULL DEFAULT 1;
  END IF;
END $$;