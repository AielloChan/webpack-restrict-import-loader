# webpack-restrict-import-loader

A webpack loader can restrict import file relation. Useful in team codebase management.

> Note: It just support js/ts/jsx/tsx file import analyze

## Usage

In your webpack config file, loader

First:

```bash
npm install --save-dev webpack-restrict-import-loader
# or 
yarn add -D webpack-restrict-import-loader
```

Then, config this loader to process script file.

```javascript
const chalk = require("chalk");

const webpackConfig = {
  entry: {
    app: "./main.tsx",
  },
  module: {
    rules: [
      {
        test: /\.(js|tsx?)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets,
              plugins: babelPlugins,
            },
          },
          {
            loader: "webpack-restrict-import-loader",
            options: {
              rules: [
                {
                  from: /wolai\/src\/stores/,
                  to: /\.tsx$/,
                  run: (from, to) => {
                    console.warn(
                      chalk.yellow("在 store 中引入 tsx 会造成文件耦合过多"),
                      `在 ${from} 中引入 ${to}`
                    );
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },
};
```

Finally, just run your webpack dev or build, you'll see some worning when 

## Options

Say that, we wanna avoid import files in 'views' folder from 'stores' folder (It will lead to recycling reference)

Our config:

```javascript
{
  loader: "webpack-restrict-import-loader",
  options: {
    rules: [
      {
        from: /\/stores\//, // mast be a RegExp
        to: /\/views\//, // mast be a RegExp
        run: (from, to) => {
          // will run this func if there has any match
          console.warn(`Should not import views file in store, try to import ${to} in ${from}`)
        }
      }
    ]
  }
}
```

We had a source file like this:

```javascript
// wolai/stores/RootStore.ts
import editor from 'wolai/views/Editor'

....
```

Run webpack, it will out put:

```bash
Should not import views file in store, try to import /User/aiello/XXXX/wolai/views/Editor.tsx in /User/aiello/XXXX/wolai/stores/RootStore.ts
```

Have fun!


