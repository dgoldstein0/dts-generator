import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import generate from '../../index';
import * as fs from 'fs';

registerSuite({
	name: 'index',
	'api': function () {
		assert.isFunction(generate, 'generate should be a function');
	},
	'generate': function () {
		return generate({
			name: 'foo',
			baseDir: 'tests/support/foo',
			files: [ 'index.ts' ],
			out: 'tmp/foo.d.ts'
		}).then(function () {
			const contents = fs.readFileSync('tmp/foo.d.ts', { encoding: 'utf8' });
			assert(contents, 'foo.d.ts should exist and have contents');
			assert.include(contents, `module 'foo/index'`);
			assert.include(contents, `module 'foo/Bar'`);
		});
	},
	'no files': function () {
		return generate({
			name: 'foo',
			baseDir: 'tests/support/foo',
			out: 'tmp/foo.nofiles.d.ts'
		}).then(function () {
			const contents = fs.readFileSync('tmp/foo.nofiles.d.ts', { encoding: 'utf8' });
			assert(contents, 'foo.nofiles.d.ts should exist and have contents');
			assert.include(contents, `module 'foo/index'`);
			assert.include(contents, `module 'foo/Bar'`);
		});
	},
	'project': function () {
		return generate({
			name: 'foo',
			project: 'tests/support/foo',
			out: 'tmp/foo.config.d.ts'
		}).then(function () {
			const contents = fs.readFileSync('tmp/foo.config.d.ts', { encoding: 'utf8' });
			assert(contents, 'foo.config.d.ts should exist and have contents');
			assert.include(contents, `module 'foo/index'`);
			assert.include(contents, `module 'foo/Bar'`);
		});
	},
	'project json file': function () {
		return generate({
			name: 'foo',
			project: 'tests/support/foo/tsconfig-alt.json',
			out: 'tmp/foo-alt.config.d.ts'
		}).then(function () {
			const contents = fs.readFileSync('tmp/foo-alt.config.d.ts', { encoding: 'utf8' });
			assert(contents, 'foo-alt.config.d.ts should exist and have contents');

			// tsconfig-alt.json includes baz and Bar but not index
			assert.include(contents, `module 'foo/baz'`);
			assert.include(contents, `module 'foo/Bar'`);
			assert.notInclude(contents, `module 'foo/index'`);
		});
	},
	'project with outDir and rootDir - directory handling stress test': function () {
		// having the extra "sub" directory in this project makes sure that we
		// respect the rootDir option.  This project also has an outDir so this
		// stresses our path-handling logic - if we mix up the directories, it'll
		// show in the output module names.
		//
		// This project also includes a tsx file and uses absolute paths, for extra
		// fun.
		return generate({
			project: 'tests/support/foo-directories',
			out: 'tmp/foo.config.d.ts'
		}).then(function () {
			const contents = fs.readFileSync('tmp/foo.config.d.ts', { encoding: 'utf8' });
			assert(contents, 'foo.config.d.ts should exist and have contents');
			assert.include(contents, `module 'sub/index'`);
			assert.include(contents, `module 'sub/Bar'`);
			assert.include(contents, `module 'sub/baz'`);

			// also check imports look right
			assert.include(contents, `import Bar from 'sub/Bar'`);
			assert.include(contents, `from 'sub/baz';`);
		});
	},
	'test prefixing of absolute paths with options.name': function () {
		// we reuse foo-directories from the directory stress test above.
		// not sure if this is the best idea because it means these tests aren't
		// totally orthogonal, but it doesn't make the test slower.
		return generate({
			project: 'tests/support/foo-directories',
			out: 'tmp/foo.config.d.ts',
			main: 'sub/index',
			name: '__abs_prefix'
		}).then(function () {
			const contents = fs.readFileSync('tmp/foo.config.d.ts', { encoding: 'utf8' });
			assert(contents, 'foo.config.d.ts should exist and have contents');
			assert.include(contents, `module '__abs_prefix/sub/index'`);
			assert.include(contents, `module '__abs_prefix/sub/Bar'`);
			assert.include(contents, `module '__abs_prefix/sub/baz'`);

			// also check imports look right
			assert.include(contents, `import Bar from '__abs_prefix/sub/Bar'`);
			assert.include(contents, `from '__abs_prefix/sub/baz';`);

			// and look at the generated main code
			assert.include(contents, `module '__abs_prefix'`);
			assert.include(contents, `import main = require('__abs_prefix/sub/index')`);
		});
	},
	'es6 main module': function () {
		return generate({
			name: 'foo',
			project: 'tests/support/foo-es6',
			out: 'tmp/foo.es6.d.ts',
			main: 'index.ts'
		}).then(function () {
			const contents = fs.readFileSync('tmp/foo.es6.d.ts', { encoding: 'utf8' });
			assert(contents, 'foo.es6.d.ts should exist and have contents');
			// assert.include(contents, `module 'foo/index'`);
			// assert.include(contents, `module 'foo/Bar'`);
		});
	}
});
