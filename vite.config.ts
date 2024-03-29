import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import autoImport from 'unplugin-auto-import/vite'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // console.log(env);
  return defineConfig({
    base: '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    // 打包
    build: {
      // sourcemap: true,
      minify: 'terser', // 必须开启：使用 terserOptions 才有效果
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production' ? true : false,
          drop_debugger: process.env.NODE_ENV === 'production' ? true : false
        }
      },
      rollupOptions: {
        // 静态资源分类打包
        output: {
          // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
          globals: {},
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
          manualChunks(id) {
            // 静态资源分拆打包
            if (id.includes('node_modules')) {
              return id
                .toString()
                .split('node_modules/')[1]
                .split('/')[0]
                .toString()
            }
          }
        }
      }
    },
    plugins: [
      vue(),
      autoImport({
        imports: ['vue'] // 需要引入的类型来源
        // dts: 'src/types/auto-import.d.ts' // 根据引入来源自动生成的类型声明文件路径
      }),
      visualizer({
        emitFile: false,
        filename: 'analysis-chart.html', // 分析图生成的文件名
        open: true // 如果存在本地服务端口，将在打包后自动展示
      })
    ]
  })
}
