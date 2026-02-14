import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOfflineSync } from '../hooks/useOfflineSync';
import type { Vendedor, RegistroAsistencia } from '../types/database';
import { LogIn, LogOut, MapPin, Clock, Wifi, WifiOff, RefreshCw, User } from 'lucide-react';

interface VendedorPanelProps {
  userId: string;
  onLogout: () => void;
}

export const VendedorPanel = ({ userId, onLogout }: VendedorPanelProps) => {
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [lugarForaneo, setLugarForaneo] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ultimoRegistro, setUltimoRegistro] = useState<RegistroAsistencia | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { pendingCount, isSyncing, isOnline, savePendingRegistro, syncPendingRegistros } = useOfflineSync();

  useEffect(() => {
    loadVendedor();
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

  const loadVendedor = async () => {
    const { data } = await supabase
      .from('vendedores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) setVendedor(data);
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
      if (data.length > 0) {
        setUltimoRegistro(data[0]);
      }
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

  const isDentroDeHorario = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const limiteMinutes = 9 * 60 + 5;
    return totalMinutes <= limiteMinutes;
  };

  const handleRegistro = async (tipo: 'entrada' | 'salida') => {
    if (!vendedor) return;

    if (tipo === 'entrada' && ultimoRegistro?.tipo === 'entrada') {
      setError('Debes hacer check-out antes de hacer otro check-in');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (tipo === 'salida' && (!ultimoRegistro || ultimoRegistro.tipo === 'salida')) {
      setError('Debes hacer check-in antes de hacer check-out');
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
      const coords = await getGeolocation();
      const registro = {
        vendedor_id: vendedor.id,
        tipo,
        fecha_hora: new Date().toISOString(),
        latitud: coords?.lat || null,
        longitud: coords?.lng || null,
        ubicacion_nombre: null,
        lugar_foraneo: lugarForaneo.trim(),
        notas: notas.trim() || null,
        sincronizado: isOnline,
        es_tardio: false,
      };

      if (isOnline) {
        const { error } = await supabase
          .from('registros_asistencia')
          .insert(registro)
          .select()
          .single();

        if (error) throw error;
      } else {
        savePendingRegistro(registro);
      }

      setSuccess(`${tipo === 'entrada' ? 'Check-in' : 'Check-out'} registrado exitosamente`);
      setTimeout(() => setSuccess(''), 3000);

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

  const puedeHacerCheckIn = !ultimoRegistro || ultimoRegistro.tipo === 'salida';
  const puedeHacerCheckOut = ultimoRegistro && ultimoRegistro.tipo === 'entrada';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] p-2 rounded-full">
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
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Clock className="w-8 h-8 text-blue-600" />
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
                  className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
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
                      <span className="font-semibold text-gray-800">
                        {registro.tipo === 'entrada' ? 'Check-in' : 'Check-out'}
                      </span>
                      <div className="flex items-center space-x-1 text-gray-600 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(registro.fecha_hora).toLocaleString('es-MX')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Lugar:</span> {registro.lugar_foraneo}
                    </p>
                    {registro.notas && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notas:</span> {registro.notas}
                      </p>
                    )}
                    {registro.latitud && registro.longitud && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{registro.latitud.toFixed(6)}, {registro.longitud.toFixed(6)}</span>
                      </div>
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
