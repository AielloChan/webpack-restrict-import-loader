const acorn = require("acorn");
const walk = require("acorn-walk");
const loaderUtils = require("loader-utils");

/**
 * 根据相对路径和当前 loader 上下文解析出文件的绝对路径
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
 * @param {string} source
 * @returns
 */
const getImportValues = (source) => {
  const result = [];
  const ast = acorn.parse(source, {
    ecmaVersion: "latest",
    sourceType: "module",
  });
  const walkConfig = {
    ImportDeclaration(node) {
      result.push(node.source.value);
    },
  };
  walk.simple(ast, walkConfig);

  return result;
};

function WebpackRestrictImportLoader(source) {
  const callback = this.async();
  const importer = this.resourcePath;
  const options = loaderUtils.getOptions(this) || { rules: [] };

  const jobs = options.rules.map(async (rule) => {
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
