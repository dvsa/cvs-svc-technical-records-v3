const path = require('path');
const AwsSamPlugin = require('aws-sam-webpack-plugin');

const awsSamPlugin = new AwsSamPlugin({ vscodeDebug: false });

module.exports = {
  // Loads the entry object from the AWS::Serverless::Function resources in your
  // SAM config. Setting this to a function will
  entry: () => awsSamPlugin.entry(),

  // Write the output to the .aws-sam/build folder
  output: {
    filename: (chunkData) => awsSamPlugin.filename(chunkData),
    libraryTarget: 'commonjs2',
    path: path.resolve('.'),
  },

  // Resolve .ts and .js extensions
  resolve: {
    extensions: ['.ts', '.js'],
  },

  // Target node
  target: 'node',

  externals: [
    /aws-sdk/,
    'fsevents'
  ],

  // Add the TypeScript loader
  module: {
    rules: [{ test: /\.tsx?$/, loader: 'ts-loader' }],
  },

  // Add the AWS SAM Webpack plugin
  plugins: [
    awsSamPlugin
  ],
};
