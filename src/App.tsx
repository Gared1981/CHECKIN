import { useState, useEffect } from 'react';
import { supabase, isAdmin } from './lib/supabase';
import { Login } from './components/Login';
import { VendedorPanel } from './components/VendedorPanel';
import { AdminPanel } from './components/AdminPanel';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  const userEmail = session.user.email;
  const isAdminUser = isAdmin(userEmail);

  console.log('👤 Usuario logueado:', {
    id: session.user.id,
    email: userEmail,
    isAdmin: isAdminUser
  });

  if (isAdminUser) {
    return <AdminPanel onLogout={handleLogout} userEmail={userEmail!} />;
  }

  return <VendedorPanel userId={session.user.id} onLogout={handleLogout} />;
}

export default App;
