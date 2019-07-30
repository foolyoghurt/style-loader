const path = require('path');

const loaderUtils = require('loader-utils');
const validateOptions = require('schema-utils');

const schema = require('./options.json');

module.exports = () => {};

module.exports.pitch = function loader(request) {
  const options = loaderUtils.getOptions(this) || {};

  validateOptions(schema, options, {
    name: 'Style Loader (URL)',
    baseDataPath: 'options',
  });

  options.hmr = typeof options.hmr === 'undefined' ? true : options.hmr;

  const hmr = [
    // Hot Module Replacement
    'if(module.hot) {',
    `  module.hot.accept(${loaderUtils.stringifyRequest(
      this,
      `!!${request}`
    )}, function() {`,
    `    update(require(${loaderUtils.stringifyRequest(
      this,
      `!!${request}`
    )}));`,
    '  });',
    '',
    '  module.hot.dispose(function() { update(); });',
    '}',
  ].join('\n');

  return [
    // Adds some reference to a CSS file to the DOM by adding a <link> tag
    `var update = require(${loaderUtils.stringifyRequest(
      this,
      `!${path.join(__dirname, 'runtime/addStyleUrl.js')}`
    )})(`,
    `  require(${loaderUtils.stringifyRequest(this, `!!${request}`)})`,
    `, ${JSON.stringify(options)});`,
    options.hmr ? hmr : '',
  ].join('\n');
};
