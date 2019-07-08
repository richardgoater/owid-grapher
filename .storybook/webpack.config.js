const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = ({ config, mode }) => {
    const cssRule = config.module.rules[2];
    const postcssLoader = cssRule.use[cssRule.use.length - 1];
    postcssLoader.options.plugins = [require('tailwindcss')];

    config.module.rules = config.module.rules.concat([
        {
            test: /\.(ts|tsx)$/,
            loader: require.resolve('ts-loader'),
            exclude: /serverSettings/,
            options: {
                transpileOnly: true,
                configFile: path.join(__dirname, '../tsconfig.client.json')
            }
        }
    ]);
    config.resolve.plugins = [
        new TsconfigPathsPlugin({
            configFile: path.join(__dirname, '../tsconfig.client.json')
        })
    ];
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
};
