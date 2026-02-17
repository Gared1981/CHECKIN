import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vendedor, RegistroAsistencia } from '../types/database';
import { Users, LogIn, LogOut, MapPin, Clock, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
  userEmail: string;
}

export const AdminPanel = ({ onLogout, userEmail }: AdminPanelProps) => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: vendedoresData } = await supabase
        .from('vendedores')
        .select('*')
        .order('nombre');

      const { data: registrosData } = await supabase
        .from('registros_asistencia')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(50);

      if (vendedoresData) setVendedores(vendedoresData);
      if (registrosData) setRegistros(registrosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRegistros = selectedVendedor
    ? registros.filter((r) => r.vendedor_id === selectedVendedor)
    : registros;

  const getVendedorNombre = (vendedorId: string) => {
    const vendedor = vendedores.find((v) => v.id === vendedorId);
    return vendedor?.nombre || 'Desconocido';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] p-2 rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm font-medium transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Vendedores</p>
                <p className="text-3xl font-bold text-gray-800">{vendedores.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Registros Hoy</p>
                <p className="text-3xl font-bold text-gray-800">
                  {registros.filter((r) => {
                    const hoy = new Date().toDateString();
                    const fechaRegistro = new Date(r.fecha_hora).toDateString();
                    return hoy === fechaRegistro;
                  }).length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Tardíos Hoy</p>
                <p className="text-3xl font-bold text-gray-800">
                  {registros.filter((r) => {
                    const hoy = new Date().toDateString();
                    const fechaRegistro = new Date(r.fecha_hora).toDateString();
                    return hoy === fechaRegistro && r.es_tardio;
                  }).length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Registros de Asistencia</h2>
            <select
              value={selectedVendedor || ''}
              onChange={(e) => setSelectedVendedor(e.target.value || null)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#667eea] focus:border-transparent outline-none"
            >
              <option value="">Todos los vendedores</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} - {v.ruta}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando...</p>
            </div>
          ) : filteredRegistros.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay registros</p>
          ) : (
            <div className="space-y-3">
              {filteredRegistros.map((registro) => (
                <div
                  key={registro.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 transition ${
                    registro.es_tardio ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-full ${registro.tipo === 'entrada' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {registro.tipo === 'entrada' ? (
                      <LogIn className="w-5 h-5 text-green-600" />
                    ) : (
                      <LogOut className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">
                          {getVendedorNombre(registro.vendedor_id)}
                        </span>
                        <span className="text-gray-600">-</span>
                        <span className="text-gray-700">
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
                    {registro.ubicacion_nombre && (
                      <div className="flex items-center space-x-1 text-sm text-gray-700 mb-1">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>
                          <span className="font-medium">Ubicación:</span> {registro.ubicacion_nombre}
                        </span>
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
