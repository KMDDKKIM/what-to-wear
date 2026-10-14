import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 주소가 https://kmddkkim.github.io/what-to-wear/ 이므로 배포 빌드에만 경로를 붙인다
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/what-to-wear/' : '/',
  plugins: [
    react(),
    // 홈 화면 설치(PWA): 앱 정보 + 오프라인 캐시
    VitePWA({
      registerType: 'autoUpdate', // 새로 배포하면 다음 실행 때 자동으로 새 버전
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '오늘 뭐 입지?',
        short_name: '뭐 입지?',
        description: '집에서 나가고 들어오는 시간과 낮 최고기온에 맞춰 오늘 옷차림을 알려드려요.',
        lang: 'ko',
        display: 'standalone',
        background_color: '#F3F6F8',
        theme_color: '#F3F6F8',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // 날씨: 인터넷이 되면 최신, 끊기면 마지막으로 받은 날씨
            urlPattern: /^https:\/\/(api|air-quality-api)\.open-meteo\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
}))
