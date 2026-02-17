export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vendedores: {
        Row: {
          id: string
          user_id: string
          nombre: string
          email: string
          telefono: string | null
          ruta: string
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nombre: string
          email: string
          telefono?: string | null
          ruta: string
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nombre?: string
          email?: string
          telefono?: string | null
          ruta?: string
          activo?: boolean
          created_at?: string
        }
      }
      registros_asistencia: {
        Row: {
          id: string
          vendedor_id: string
          tipo: 'entrada' | 'salida'
          fecha_hora: string
          latitud: number | null
          longitud: number | null
          ubicacion_nombre: string | null
          lugar_foraneo: string
          notas: string | null
          created_at: string
          sincronizado: boolean
          es_tardio: boolean
          semana_laboral: number
        }
        Insert: {
          id?: string
          vendedor_id: string
          tipo: 'entrada' | 'salida'
          fecha_hora: string
          latitud?: number | null
          longitud?: number | null
          ubicacion_nombre?: string | null
          lugar_foraneo: string
          notas?: string | null
          created_at?: string
          sincronizado?: boolean
          es_tardio?: boolean
          semana_laboral?: number
        }
        Update: {
          id?: string
          vendedor_id?: string
          tipo?: 'entrada' | 'salida'
          fecha_hora?: string
          latitud?: number | null
          longitud?: number | null
          ubicacion_nombre?: string | null
          lugar_foraneo?: string
          notas?: string | null
          created_at?: string
          sincronizado?: boolean
          es_tardio?: boolean
          semana_laboral?: number
        }
      }
    }
  }
}

export type Vendedor = Database['public']['Tables']['vendedores']['Row']
export type RegistroAsistencia = Database['public']['Tables']['registros_asistencia']['Row']
