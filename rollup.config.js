import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
const pkg = require('./package.json');

export default [
  // 主包
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        compilerOptions: {
          module: 'esnext'
        }
      }),
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true
        }
      })
    ],
    external: Object.keys(pkg.peerDependencies || {})
  },
  
  // 核心模块
  {
    input: 'src/core/index.ts',
    output: [
      {
        file: 'dist/core/index.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/core/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        compilerOptions: {
          module: 'esnext'
        }
      }),
      terser()
    ]
  },
  
  // 构建器模块
  {
    input: 'src/builder/index.ts',
    output: [
      {
        file: 'dist/builder/index.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/builder/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        compilerOptions: {
          module: 'esnext'
        }
      }),
      terser()
    ]
  },
  
  // 插件模块
  {
    input: 'src/plugins/index.ts',
    output: [
      {
        file: 'dist/plugins/index.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/plugins/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
      terser()
    ]
  },
  
  // 工具模块
  {
    input: 'src/utils/index.ts',
    output: [
      {
        file: 'dist/utils/index.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/utils/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
      terser()
    ]
  }
];