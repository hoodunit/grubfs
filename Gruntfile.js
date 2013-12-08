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
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');


  grunt.registerTask('mocha', 'run mocha', function () {
    var done = this.async();
    require('child_process').exec('mocha ./test/unittests/unittests.js', function (err, stdout) {
      grunt.log.write(stdout);
      done(err);
    });
  });

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('default', ['test', 'browserify', 'mocha']);

};
