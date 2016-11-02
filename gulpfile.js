/* global require */

'use strict'; // jshint ignore:line

var del             = require('del'),
	gulp			= require('gulp'),
	should			= require('gulp-if'),
	notify			= require('gulp-notify'),
	rename			= require('gulp-rename'),
	concat			= require('gulp-concat'),
	browserSync		= require('browser-sync'),
	plumber			= require('gulp-plumber'),
	// (S)CSS STUFF
	sass			= require('gulp-sass'),
	postcss			= require('gulp-postcss'),
	autoprefixer	= require('autoprefixer-core'),
	mqpacker		= require('css-mqpacker'),
	csswring		= require('csswring'),
	// image stuff
	cache			= require('gulp-cache'),
	imagemin		= require('gulp-imagemin'),
	// js stuff
	jshint			= require('gulp-jshint'),
	stylish			= require('jshint-stylish'),
	uglify			= require('gulp-uglify'),
	// jade stuff
	jade			= require('gulp-jade'),
	// variables
	production = false;

gulp.task('sass', function() {
	var postpros = [ autoprefixer({ browsers: 'last 2 versions' }) ];

	if (production) postpros.push(mqpacker, csswring({ removeAllComments: true }));

	return gulp.src('./src/scss/**/*.scss')
		.pipe(sass().on('error', notify.onError('<%= error.message %>')))
		.pipe(postcss(postpros))
		.pipe(should(production, rename({ suffix: '.min' })))
		.pipe(gulp.dest('./'));
});

gulp.task('lint-js', function() {
	return gulp.src('src/js/**/*.js')
		.pipe(jshint())
		.pipe(notify(function (file) {
			if (file.jshint.success) return false;
			var errors = file.jshint.results.map(function (data) {
				if (data.error) return '(' + data.error.line + ') ' + data.error.reason;
			}).join('\n');
			return file.relative + ' (' + file.jshint.results.length + ' errors)\n' + errors;
		}));
});

gulp.task('js', ['lint-js'], function() {
	gulp.src('src/js/**/*.js')
		.pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
		.pipe(concat('main.js'))
		.pipe(should(production, uglify()))
		.pipe(should(production, rename({ suffix: '.min' })))
		.pipe(gulp.dest('./js/'));
});

gulp.task('templates', function() {
	gulp.src('src/jade/*.jade')
		.pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
		.pipe(jade({
			basedir: './src/jade',
			locals: { production: production }
		}))
		.pipe(gulp.dest('./'));
});

gulp.task('imgs', function() {
	gulp.src('src/imgs/**/*.svg')
		.pipe(should(production, imagemin()))
		.pipe(gulp.dest('./imgs'));
});

gulp.task('copy', function() {
    gulp.src('src/fonts/*')
        .pipe(gulp.dest('./fonts'));
});

gulp.task('watch', function() {
	browserSync.init(null, {
		server: { baseDir: '././' },
		notify: false,
		open: false
	});

	gulp.watch('src/jade/**/*.jade', ['templates']);
	gulp.watch('src/scss/**/*.scss', ['sass']);
	gulp.watch('src/imgs/**/*.svg', ['imgs']);
	gulp.watch('src/js/**/*.js', ['js']);
	gulp.watch(['./**/*'], function(e) {
		gulp.src(e.path)
			.pipe(browserSync.reload({ stream:true }));
	});
});

gulp.task('default', function() {
	gulp.start('copy', 'sass', 'imgs', 'js', 'templates');
});

gulp.task('prod', function() {
	production = true;
	gulp.start('default');
});