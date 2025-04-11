const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js-carousel.min.js',
    library: {
      name: 'CloudImageCarousel',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'typeof self !== "undefined" ? self : this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: true,
          mangle: true,
        },
      }),
      new CssMinimizerPlugin(), // CSS minification
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'js-carousel.min.css',
    }),
  ],
  devServer: {
    static: [
      {
        directory: path.resolve(__dirname, 'examples'), // Serve your index.html
        publicPath: '/',
      },
      {
        directory: path.resolve(__dirname, 'dist'), // Serve your bundled JS
        publicPath: '/dist',
      },
      {
        directory: path.resolve(__dirname, 'src'), // Src files for dev
        publicPath: '/src',
      },
    ],
    open: true,
    port: 3000,
    compress: true,
  },
}
