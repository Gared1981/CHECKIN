import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'pending_registros';
const AUTO_REFRESH_INTERVAL = 30000;

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const getPendingRegistros = useCallback((): any[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading pending registros:', error);
      return [];
    }
  }, []);

  const savePendingRegistro = useCallback((registro: any) => {
    try {
      const pending = getPendingRegistros();
      pending.push(registro);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
      setPendingCount(pending.length);
      console.log('Registro guardado en modo offline:', registro);
    } catch (error) {
      console.error('Error saving pending registro:', error);
    }
  }, [getPendingRegistros]);

  const syncPendingRegistros = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    const pending = getPendingRegistros();
    if (pending.length === 0) return;

    setIsSyncing(true);
    console.log(`Iniciando sincronización de ${pending.length} registros pendientes...`);

    const successfulSyncs: number[] = [];

    for (let i = 0; i < pending.length; i++) {
      try {
        const registro = pending[i];
        console.log(`Sincronizando registro ${i + 1}/${pending.length}:`, registro);

        const { data, error } = await supabase
          .from('registros_asistencia')
          .insert({
            ...registro,
            sincronizado: true,
          })
          .select()
          .single();

        if (error) {
          console.error(`Error sincronizando registro ${i + 1}:`, error);
          continue;
        }

        console.log(`Registro ${i + 1} sincronizado exitosamente:`, data);
        successfulSyncs.push(i);
      } catch (error) {
        console.error(`Error inesperado sincronizando registro ${i + 1}:`, error);
      }
    }

    if (successfulSyncs.length > 0) {
      const remainingPending = pending.filter((_, index) => !successfulSyncs.includes(index));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingPending));
      setPendingCount(remainingPending.length);
      console.log(`Sincronización completada: ${successfulSyncs.length} exitosos, ${remainingPending.length} pendientes`);
      setLastSyncTime(new Date());
    }

    setIsSyncing(false);
  }, [isOnline, isSyncing, getPendingRegistros]);

  useEffect(() => {
    const updatePendingCount = () => {
      const pending = getPendingRegistros();
      setPendingCount(pending.length);
    };

    updatePendingCount();

    const handleOnline = () => {
      console.log('Conexión restaurada, sincronizando automáticamente...');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Conexión perdida, modo offline activado');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [getPendingRegistros]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      console.log('Auto-sincronizando registros pendientes...');
      syncPendingRegistros();
    }
  }, [isOnline, pendingCount, isSyncing, syncPendingRegistros]);

  useEffect(() => {
    if (!isOnline) return;

    const intervalId = setInterval(() => {
      console.log('Verificando registros pendientes...');
      const pending = getPendingRegistros();
      setPendingCount(pending.length);

      if (pending.length > 0 && !isSyncing) {
        syncPendingRegistros();
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isOnline, isSyncing, getPendingRegistros, syncPendingRegistros]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    savePendingRegistro,
    syncPendingRegistros,
  };
};
