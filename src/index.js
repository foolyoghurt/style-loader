import path from 'path';

import loaderUtils from 'loader-utils';
import validateOptions from 'schema-utils';

import schema from './options.json';

module.exports = () => {};

module.exports.pitch = function loader(request) {
  const options = {...(loaderUtils.getOptions(this) || {})}; 
 	options.attrs = {...(options.attrs || {})};

  validateOptions(schema, options, {
    name: 'Style Loader',
    baseDataPath: 'options',
  });

  options.hmr = typeof options.hmr === 'undefined' ? true : options.hmr;

  // The variable is needed, because the function should be inlined.
  // If is just stored it in options, JSON.stringify will quote
  // the function and it would be just a string at runtime
  let insertInto;

  if (typeof options.insertInto === 'function') {
    insertInto = options.insertInto.toString();
  }

  // We need to check if it a string, or variable will be "undefined"
  // and the loader crashes
  if (typeof options.insertInto === 'string') {
    insertInto = `"${options.insertInto}"`;
  }
  
  const context = options.context || this.rootContext || (this.options && this.options.context); 
	const attrs = options.attrs || {};
	for (let key in attrs) {                                
		let name = loaderUtils.interpolateName(this, attrs[key], {                
			context, 
			content: null,
			regExp: options.regExp,    
		});
		// node_modules/_@ali_vc-xxx-yyy@1.0.0@@ali/vc-xxx-yyy/lib/vu-xxx-yyy-properties/index.less
		// node_modules/_@ali_vc-xxx-yyy@1.0.1-beta.9@@ali/vc-xxx-yyy/lib/Download/view.less
		// remove path of node_modules
		attrs[key] = name.replace(/node_modules\/[\w-_@]+?@\d+\.\d+\.\d+(?:-beta(?:\.\d+)?)?@/, '');
	}

  const hmr = [
    // Hot Module Replacement,
    'if(module.hot) {',
    // When the styles change, update the <style> tags
    `	module.hot.accept(${loaderUtils.stringifyRequest(
      this,
      `!!${request}`
    )}, function() {`,
    `		var newContent = require(${loaderUtils.stringifyRequest(
      this,
      `!!${request}`
    )});`,
    '',
    "		if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];",
    '',
    '		var locals = (function(a, b) {',
    '			var key, idx = 0;',
    '',
    '			for(key in a) {',
    '				if(!b || a[key] !== b[key]) return false;',
    '				idx++;',
    '			}',
    '',
    '			for(key in b) idx--;',
    '',
    '			return idx === 0;',
    '		}(content.locals, newContent.locals));',
    '',
    // This error is caught and not shown and causes a full reload
    "		if(!locals) throw new Error('Aborting CSS HMR due to changed css-modules locals.');",
    '',
    '		update(newContent);',
    '	});',
    '',
    // When the module is disposed, remove the <style> tags
    '	module.hot.dispose(function() { update(); });',
    '}',
  ].join('\n');

  return [
    // Style Loader
    // Adds CSS to the DOM by adding a <style> tag
    '',
    // Load styles
    `var content = require(${loaderUtils.stringifyRequest(
      this,
      `!!${request}`
    )});`,
    '',
    "if(typeof content === 'string') content = [[module.id, content, '']];",
    '',
    'var insertInto;',
    '',
    `var options = ${JSON.stringify(options)}`,
    '',
    `options.insertInto = ${insertInto};`,
    '',
    // Add styles to the DOM
    `var update = require(${loaderUtils.stringifyRequest(
      this,
      `!${path.join(__dirname, 'runtime/addStyles.js')}`
    )})(content, options);`,
    '',
    'if(content.locals) module.exports = content.locals;',
    '',
    options.hmr ? hmr : '',
  ].join('\n');
};
