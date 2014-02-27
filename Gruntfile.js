module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 
              'src/**/*.js',
              'test/unit_server/**/*.js',
              'test/unit_client/**/*.js',
              'test/end_to_end/**/*.js'],
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
    },
    dalek: {
      options: {
        browser: ['chrome']
      },
      dist: {
        src: ['test/end_to_end/test.js'],
        reporter: ['html']
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/unit_server/**/*.js', 'test/unit_shared/**/*.js', 'test/unit_client/**/*.js']
      },
      test_jenkins: {
        options: {
          reporter: 'mocha-jenkins-reporter'
        },
        src: ['test/unit_server/**/*.js', 'test/unit_shared/**/*.js', 'test/unit_client/**/*.js']
      }
    },
    clean: ["coverage/"],
    exec: {
      coverage: {
        command: "istanbul cover node_modules/mocha/bin/_mocha test/unit_client test/unit_shared -- -R mocha-jenkins-reporter",
        stdout: true
      }
    },
    watch: {
      scripts: {
        files: ['src/**/*.js', 
                'test/unit_server/**/*.js',
                'test/unit_client/**/*.js',
                'test/end_to_end/**/*.js'],
        tasks: ['jshint', 'browserify', 'unitTests'],
        options: {
          spawn: false
        }}},
  });

  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-dalek');

  grunt.registerTask('unitTests', ['mochaTest:test']);
  grunt.registerTask('unitTests_jenkins', ['mochaTest:test_jenkins']);
  grunt.registerTask('endToEndTests', ['dalek']);
  grunt.registerTask('coverage', ['clean','exec:coverage']);

  grunt.registerTask('default', ['browserify', 'jshint', 'unitTests']);
  grunt.registerTask('jenkins', ['browserify', 'jshint', 'unitTests_jenkins']);

};
