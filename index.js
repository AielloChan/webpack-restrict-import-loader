const parser = require("@babel/parser");
const loaderUtils = require("loader-utils");
const { default: traverse } = require("@babel/traverse");

/**
 * 根据相对路径和当前 loader 上下文解析出文件的绝对路径
 *
 * Resolve absolute path according to the relative path and the current loader context
 * @param {string} src
 * @param {webpack.loader.LoaderContext} context
 * @returns
 */
const resolvePath = (src, context) =>
  new Promise((resolve, reject) =>
    context.resolve(context.context, src, (err, res) =>
      err ? reject(err) : resolve(res)
    )
  );

/**
 * 获得当前源码中所有被 import 的值
 * 如: import a from './test.ts'
 * 会得到: ['./test.ts']
 *
 * Get all imported values ​​in the current source code
 * e.g. import a from './test.ts'
 * Will get: ['./test.ts']
 * @param {string} source
 * @returns
 */
const getImportValues = (source) => {
  const result = [];
  let ast;
  try {
    ast = parser.parse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch (e) {
    console.error("babel parse source error: ", source, e);
    return result;
  }
  traverse(ast, {
    ImportDeclaration(node) {
      result.push(node.node.source.value);
    },
  });

  return result;
};

function WebpackRestrictImportLoader(source) {
  if (this.resourcePath.indexOf("node_modules") !== -1) {
    return source;
  }

  const callback = this.async();
  const importer = this.resourcePath;
  const { rules } = loaderUtils.getOptions(this) || { rules: [] };

  const jobs = rules.map(async (rule) => {
    const { from, to, run } = rule;

    if (from.test(importer)) {
      const moduleList = getImportValues(source);
      const imported = await Promise.all(
        moduleList.map((src) => resolvePath(src, this))
      );
      const target = imported.find((item) => to.test(item));
      if (target && run) {
        run(importer, target);
      }
    }
  });

  Promise.all(jobs)
    .catch((e) => console.error("WebpackRestrictImportLoader error: ", e))
    .finally(() => callback(null, source));
}

module.exports = WebpackRestrictImportLoader;
