const gulp = require('gulp');
const less = require('gulp-less');
const watch = require('gulp-watch');
const batch = require('gulp-batch');
const plumber = require('gulp-plumber');
const jetpack = require('fs-jetpack');
const bundle = require('./bundle');
const utils = require('./utils');

const projectDir = jetpack;
const srcDir = jetpack.cwd('./src');
const destDir = jetpack.cwd('./app');
const buildDir = jetpack.cwd('./build');

gulp.task('bundle', () => {
	return Promise.all([
		bundle(srcDir.path('background.js'), destDir.path('background.js')),
		bundle(srcDir.path('app.js'), destDir.path('app.js')),
		bundle(srcDir.path('api.js'), destDir.path('api.js'))
		// Bundle(srcDir.path('menu.js'), destDir.path('menu.js'))
	]);
});

gulp.task('less', () => {
	return gulp.src(srcDir.path('stylesheets/main.less'))
		.pipe(plumber())
		.pipe(less())
		.pipe(gulp.dest(destDir.path('stylesheets')));
});

gulp.task('environment', () => {
	const configFile = `config/env_${utils.getEnvName()}.json`;
	projectDir.copy(configFile, destDir.path('env.json'), {overwrite: true});
});

gulp.task('icon', () => {
	projectDir.copy(buildDir.path('icon.ico'), destDir.path('icon.ico'), {overwrite: true});
});

gulp.task('watch', () => {
	const beepOnError = done => {
		return err => {
			if (err) {
				utils.beepSound();
			}
			done(err);
		};
	};

	watch('src/**/*.js', batch((events, done) => {
		gulp.start('bundle', beepOnError(done));
	}));
	watch('src/**/*.less', batch((events, done) => {
		gulp.start('less', beepOnError(done));
	}));
});

gulp.task('build', ['bundle', 'less', 'environment', 'icon']);