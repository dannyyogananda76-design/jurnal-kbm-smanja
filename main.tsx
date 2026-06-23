import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabase';

// Dynamically update favicon and title from instansi logo
const updateBranding = async () => {
  const { data } = await supabase.from('instansi').select('logo_url, nama_instansi').maybeSingle();
  if (data?.logo_url) {
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    if (favicon) favicon.href = data.logo_url;
  }
  if (data?.nama_instansi) {
    document.title = `Jurnal Mengajar Guru - ${data.nama_instansi}`;
  }
};
updateBranding();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
