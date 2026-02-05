import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks - library besar dipisah
            if (id.includes('node_modules')) {
              // React core
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // UI libraries
              if (id.includes('lucide-react')) {
                return 'vendor-ui';
              }
              // AI/Gemini
              if (id.includes('@google/genai')) {
                return 'vendor-ai';
              }
              // Excel/XLSX
              if (id.includes('xlsx')) {
                return 'vendor-xlsx';
              }
              // Supabase
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              // Toast notifications
              if (id.includes('react-hot-toast')) {
                return 'vendor-toast';
              }
              // Other vendors
              return 'vendor-other';
            }

            // Component chunks - komponen besar dipisah berdasarkan dashboard
            if (id.includes('/components/Dashboard')) {
              if (id.includes('DashboardSuperAdmin')) {
                // Pisahkan views SuperAdmin
                if (id.includes('/views/')) {
                  return 'dashboard-superadmin-views';
                }
                // Pisahkan hooks SuperAdmin
                if (id.includes('/hooks/')) {
                  return 'dashboard-superadmin-hooks';
                }
                // Pisahkan modals SuperAdmin
                if (id.includes('/modals/')) {
                  return 'dashboard-superadmin-modals';
                }
                return 'dashboard-superadmin';
              }
              if (id.includes('DashboardOperatorData')) {
                return 'dashboard-operator';
              }
              if (id.includes('DashboardWakilKurikulum')) {
                return 'dashboard-wakil';
              }
              if (id.includes('DashboardStaffTU')) {
                return 'dashboard-staff';
              }
              if (id.includes('DashboardGuruMapel')) {
                return 'dashboard-guru-mapel';
              }
              if (id.includes('DashboardWaliKelas')) {
                return 'dashboard-wali-kelas';
              }
              if (id.includes('DashboardGuruBimbel')) {
                return 'dashboard-guru-bimbel';
              }
              if (id.includes('DashboardKepalaSekolah')) {
                return 'dashboard-kepala-sekolah';
              }
              if (id.includes('DashboardOrangTua')) {
                return 'dashboard-orang-tua';
              }
            }

            // Data/shared files
            if (id.includes('/data/sharedData')) {
              return 'shared-data';
            }
          }
        }
      },
      chunkSizeWarningLimit: 600, // Turunkan limit untuk warning lebih awal
      minify: 'esbuild', // Gunakan esbuild (built-in, lebih cepat)
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    }
  };
});
