import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'fs'; 

export default defineConfig({
  plugins: [
    viteSingleFile(),
    // НАШ КАСТОМНЫЙ ПЛАГИН ДЛЯ ВСТАВКИ JSON
    {
      name: 'inject-build-config',
      transformIndexHtml(html) {
        try {
          // Читаем файл build.json из корня проекта
          const buildData = fs.readFileSync('./build.json', 'utf-8');
          // Формируем тег скрипта с глобальной переменной
          const scriptTag = `\n<script>\nvar buildConfig = ${buildData};\n</script>\n`;
          // Вклеиваем его прямо перед закрывающим тегом body
          return html.replace('</body>', `${scriptTag}</body>`);
        } catch (e) {
          console.warn('Файл build.json не найден. Сборка продолжается без него.');
          return html;
        }
      }
    }
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, 
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.log', 'console.debug', 'console.warn'], // Удалит все логи
        passes: 3
      },
      format: {
        comments: false 
      }
    },
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, 
  }
});