import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOfflineSync } from '../hooks/useOfflineSync';
import type { Vendedor, RegistroAsistencia } from '../types/database';
import { LogIn, LogOut, MapPin, Clock, Wifi, WifiOff, RefreshCw, User } from 'lucide-react';

interface VendedorPanelProps {
  userId: string;
  onLogout: () => void;
}

const getNumeroSemanaLaboral = (): number => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

export const VendedorPanel = ({ userId, onLogout }: VendedorPanelProps) => {
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [lugarForaneo, setLugarForaneo] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ubicacionActual, setUbicacionActual] = useState<string>('');
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [semanaLaboral] = useState(getNumeroSemanaLaboral());

  const { pendingCount, isSyncing, isOnline, savePendingRegistro, syncPendingRegistros } = useOfflineSync();

  useEffect(() => {
    console.log('🔄 useEffect loadVendedor - userId:', userId);
    if (userId) {
      loadVendedor();
    } else {
      console.error('❌ userId es null o undefined');
      setError('No se pudo identificar al usuario');
    }
  }, [userId]);

  useEffect(() => {
    if (vendedor) {
      loadRegistros();
    }
  }, [vendedor]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    cargarUbicacionActual();
  }, []);

  const loadVendedor = async () => {
    try {
      console.log('🔍 Cargando vendedor para userId:', userId);

      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('📦 Resultado de consulta vendedor:', { data, error });

      if (error) {
        console.error('❌ Error cargando vendedor:', error);
        setError('Error al cargar información del vendedor: ' + error.message);
        return;
      }

      if (data) {
        console.log('✅ Vendedor cargado exitosamente:', data);
        setVendedor(data);
        setError(''); // Limpiar cualquier error previo
      } else {
        console.warn('⚠️ No se encontró vendedor para userId:', userId);
        setError('No se encontró información del vendedor');
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setError('Error al cargar datos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const loadRegistros = async () => {
    if (!vendedor) return;

    const { data } = await supabase
      .from('registros_asistencia')
      .select('*')
      .eq('vendedor_id', vendedor.id)
      .order('fecha_hora', { ascending: false })
      .limit(10);

    if (data) {
      setRegistros(data);
    }
  };

  const getGeolocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        { timeout: 5000 }
      );
    });
  };

  const getNombreUbicacion = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TerrapescaCheckIn/1.0'
          }
        }
      );

      if (!response.ok) {
        return '';
      }

      const data = await response.json();
      const address = data.address || {};

      const ciudad = address.city || address.town || address.village || address.municipality || '';
      const estado = address.state || '';

      if (ciudad && estado) {
        return `${ciudad}, ${estado}`;
      } else if (ciudad) {
        return ciudad;
      } else if (estado) {
        return estado;
      }

      return data.display_name || '';
    } catch (error) {
      console.error('Error obteniendo nombre de ubicación:', error);
      return '';
    }
  };

  const cargarUbicacionActual = async () => {
    setCargandoUbicacion(true);
    try {
      const coords = await getGeolocation();
      if (coords) {
        const nombreLugar = await getNombreUbicacion(coords.lat, coords.lng);
        setUbicacionActual(nombreLugar);
      }
    } catch (error) {
      console.error('Error cargando ubicación:', error);
    } finally {
      setCargandoUbicacion(false);
    }
  };

  const isDentroDeHorario = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const limiteMinutes = 9 * 60 + 5;
    return totalMinutes <= limiteMinutes;
  };

  const handleRegistro = async (tipo: 'entrada' | 'salida') => {
    if (!vendedor) {
      setError('No se pudo cargar la información del vendedor');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!lugarForaneo.trim()) {
      setError('El campo "Lugar donde te hospedas" es obligatorio');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Iniciando registro...', { vendedor: vendedor.nombre, tipo });

      const coords = await getGeolocation();
      console.log('Coordenadas obtenidas:', coords);

      if (!coords) {
        throw new Error('No se pudo obtener la ubicación. La ubicación es obligatoria para registrar asistencia.');
      }

      let nombreUbicacion = null;
      if (coords) {
        nombreUbicacion = await getNombreUbicacion(coords.lat, coords.lng);
        console.log('Nombre de ubicación obtenido:', nombreUbicacion);
      }

      const ahora = new Date();
      const esTardio = tipo === 'entrada' && !isDentroDeHorario();

      const registro = {
        vendedor_id: vendedor.id,
        tipo,
        fecha_hora: ahora.toISOString(),
        latitud: coords?.lat || null,
        longitud: coords?.lng || null,
        ubicacion_nombre: nombreUbicacion,
        lugar_foraneo: lugarForaneo.trim(),
        notas: notas.trim() || null,
        sincronizado: isOnline,
        es_tardio: esTardio,
        semana_laboral: semanaLaboral,
      };

      console.log('Registro a insertar:', registro);

      if (isOnline) {
        const { data, error } = await supabase
          .from('registros_asistencia')
          .insert(registro as any)
          .select()
          .single();

        if (error) {
          console.error('Error de Supabase:', error);
          throw error;
        }

        console.log('Registro insertado exitosamente:', data);

        const horaFormateada = ahora.toLocaleString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        const envs = import.meta.env;

        console.log('Enviando confirmación por correo...');
        const confirmacionResponse = await fetch(`${envs.VITE_SUPABASE_URL}/functions/v1/confirmar-registro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendedor: vendedor.nombre,
            ruta: vendedor.ruta,
            email: vendedor.email,
            tipo,
            hora: horaFormateada,
            lugar: lugarForaneo.trim(),
            notas: notas.trim() || 'Sin notas',
            latitud: coords?.lat || null,
            longitud: coords?.lng || null,
          }),
        });

        if (confirmacionResponse.ok) {
          console.log('Correo de confirmación enviado exitosamente');
        } else {
          console.error('Error enviando confirmación:', await confirmacionResponse.text());
        }

        if (esTardio) {
          console.log('Enviando notificación de check-in tardío...');
          const tardioResponse = await fetch(`${envs.VITE_SUPABASE_URL}/functions/v1/notificar-checada-tardia`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vendedor: vendedor.nombre,
              ruta: vendedor.ruta,
              email: vendedor.email,
              hora: horaFormateada,
              lugar: lugarForaneo.trim(),
              notas: notas.trim() || 'Sin notas',
            }),
          });

          if (tardioResponse.ok) {
            console.log('Notificación de tardío enviada exitosamente');
          } else {
            console.error('Error enviando notificación de tardío:', await tardioResponse.text());
          }
        }
      } else {
        savePendingRegistro(registro);
      }

      setSuccess(`${tipo === 'entrada' ? 'Check-in' : 'Check-out'} registrado exitosamente${esTardio ? ' (TARDÍO)' : ''}`);
      setTimeout(() => setSuccess(''), 5000);

      setLugarForaneo('');
      setNotas('');
      loadRegistros();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const puedeHacerCheckIn = true;
  const puedeHacerCheckOut = true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003d5c] to-[#c41e3a] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <div className="flex flex-col items-center mb-6">
            <img
              src="/LOGO_TERRAPESCA_vertical.webp"
              alt="Terrapesca Logo"
              className="h-24 mb-3"
            />
            <div className="bg-gradient-to-r from-[#003d5c] to-[#c41e3a] text-white px-6 py-2 rounded-lg">
              <span className="text-lg font-bold">Semana Laboral: {semanaLaboral}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-[#003d5c] to-[#c41e3a] p-2 rounded-full">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{vendedor?.nombre}</h2>
                <p className="text-sm text-gray-600">Ruta: {vendedor?.ruta}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm font-medium transition"
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Modo offline</span>
                </>
              )}
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{pendingCount} pendientes</span>
                <button
                  onClick={syncPendingRegistros}
                  disabled={isSyncing || !isOnline}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${isDentroDeHorario() ? 'bg-green-100' : 'bg-red-100'}`}>
                <Clock className={`w-8 h-8 ${isDentroDeHorario() ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-800 font-mono">
                  {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {currentTime.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${isDentroDeHorario() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className="font-semibold text-sm">
                {isDentroDeHorario() ? '✓ Horario válido' : '⚠ Fuera de horario'}
              </span>
            </div>
          </div>
          {!isDentroDeHorario() && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
              <strong>Aviso:</strong> El check-in después de las 9:05 AM se registrará como tardío y se notificará a administración.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-blue-100">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Tu ubicación actual</h3>
              {cargandoUbicacion ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-500">Obteniendo ubicación...</span>
                </div>
              ) : ubicacionActual ? (
                <p className="text-lg font-semibold text-gray-800">{ubicacionActual}</p>
              ) : (
                <p className="text-sm text-gray-500">No disponible</p>
              )}
            </div>
            <button
              onClick={cargarUbicacionActual}
              disabled={cargandoUbicacion}
              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition disabled:opacity-50"
              title="Actualizar ubicación"
            >
              <RefreshCw className={`w-5 h-5 text-blue-600 ${cargandoUbicacion ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Registrar Asistencia</h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lugar donde te hospedas <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={lugarForaneo}
                onChange={(e) => setLugarForaneo(e.target.value)}
                placeholder="Ej: Hotel Plaza, Culiacán"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Visita programada a cliente ABC"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none transition resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleRegistro('entrada')}
              disabled={loading || !puedeHacerCheckIn}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:cursor-not-allowed"
            >
              <LogIn className="w-6 h-6" />
              <span>CHECK-IN</span>
            </button>

            <button
              onClick={() => handleRegistro('salida')}
              disabled={loading || !puedeHacerCheckOut}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:cursor-not-allowed"
            >
              <LogOut className="w-6 h-6" />
              <span>CHECK-OUT</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Historial Reciente</h3>

          {registros.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay registros aún</p>
          ) : (
            <div className="space-y-3">
              {registros.map((registro) => (
                <div
                  key={registro.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-100 transition ${
                    registro.es_tardio ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-full ${registro.tipo === 'entrada' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {registro.tipo === 'entrada' ? (
                      <LogIn className={`w-5 h-5 ${registro.tipo === 'entrada' ? 'text-green-600' : 'text-blue-600'}`} />
                    ) : (
                      <LogOut className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">
                          {registro.tipo === 'entrada' ? 'Check-in' : 'Check-out'}
                        </span>
                        {registro.es_tardio && (
                          <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-semibold rounded">
                            TARDÍO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(registro.fecha_hora).toLocaleString('es-MX')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Hospedaje:</span> {registro.lugar_foraneo}
                    </p>
                    {(registro.ubicacion_nombre || (registro.latitud && registro.longitud)) && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mb-1">
                        {registro.ubicacion_nombre && (
                          <div className="flex items-center space-x-1 text-sm text-blue-900 mb-1">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{registro.ubicacion_nombre}</span>
                          </div>
                        )}
                        {registro.latitud && registro.longitud && (
                          <div className="flex items-center space-x-1 text-xs text-blue-700">
                            <MapPin className="w-3 h-3" />
                            <span className="font-mono">
                              {registro.latitud.toFixed(6)}, {registro.longitud.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {registro.notas && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notas:</span> {registro.notas}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
