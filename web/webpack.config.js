import HtmlWebpackPlugin from "html-webpack-plugin";

export default (env, { mode }) => {
  const inDev = mode === "development";

  return {
    output: {
      filename: inDev ? "[name].js" : "[name].[contenthash].js",
    },
    resolve: {
      extensions: ["..", ".tsx", ".ts"],
      extensionAlias: {
        ".js": [".ts", ".tsx", ".js"],
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [new HtmlWebpackPlugin({ publicPath: "/" })],
    devServer: {
      port: 4000,
      hot: false,
      open: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ["/api"],
          target: "http://localhost:3000",
          pathRewrite: { "^/api": "" }, // don't pass the "/api" part along
        },
      ],
    },
  };
};
