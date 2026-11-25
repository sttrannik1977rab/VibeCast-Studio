import { defineConfig } from 'vite'
// defineConfig - вспомогательная функция для автодополнения и проверки типов
export default defineConfig({
  // root: корневая директория проекта (по умолчанию текущая)
  root: '.',

  // server: настройки режима разработки
  server: {

    port: 3000, // Порт для разработки
    open: true, // Автоматически открыть браузер при запуске
    // proxy: для обхода CORS, если бэкенд на другом порту
    proxy: {

      '/api': {

        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },

  // build: настройки продакшен сборки
  build: {

    outDir: 'dist', // Папка для собранных файлов
    sourcemap: true, // Генерация source maps для отладки
     minify: 'esbuild',    // Минификация кода (esbuild быстрее terser)
  },

  // resolve: настройка путей для импортов
  resolve: {

    alias: {

      '@': '/src/',        // Позволяет импортировать так: import X from '@/components/X'
    }
  }
});