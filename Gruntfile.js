module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    browserify: {
      dist: {
        files: {
          'public/js/client.js': ['src/client/*.js']
        }
      },
      tests: {
        src: [ 'test/unittests/unittests.js' ],
        dest: './browsertest/browserified_tests.js',
        options: {
          debug: true
        }}
    },
    watch: {
      scripts: {
        files: ['src/client/**/*.js'],
        tasks: ['jshint', 'browserify'],
        options: {
          spawn: false
        }}},
    dalek: {
      dist: {
        src: ['test/test.js'],
        reporter: ['html']
      }
    },
    'mocha_phantomjs': {
      all: {
        options: {
          urls: [
            './browsertest/index.html'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-dalek');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('mocha', 'run mocha', function () {
    var done = this.async();
    require('child_process').exec('mocha ./test/unittests/unittests.js', function (err, stdout) {
      grunt.log.write(stdout);
      done(err);
    });
  });

  grunt.registerTask('default', ['browserify', 'jshint', 'mocha', 'mocha_phantomjs']);

};
