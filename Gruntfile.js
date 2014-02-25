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
      },
      tests: {
        src: [ 'test/unit_client/**/*.js' ],
        dest: './test/generated/browserified_tests.js',
        options: {
          debug: true
        }}
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
        src: ['test/unit_server/**/*.js', 'test/unit_shared/**/*.js'],
      }
    },
    mocha_phantomjs: {
      all: {
        options: {
          urls: [
            './test/index.html'
          ]
        }
      }
    },
    exec: {
      coverage: {
        command: "istanbul cover node_modules/mocha/bin/_mocha test/unit_client test/unit_shared -- -R spec",
        stdout: true
      }
    },
    watch: {
      scripts: {
        files: ['src/**/*.js', 
                'test/unit_server/**/*.js',
                'test/unit_client/**/*.js',
                'test/end_to_end/**/*.js'],
        tasks: ['jshint', 'browserify', 'unitTestsServer', 'unitTestsClient'],
        options: {
          spawn: false
        }}},
  });

  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-dalek');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('unitTestsServer', ['mochaTest']);
  grunt.registerTask('unitTestsClient', ['mocha_phantomjs']);
  grunt.registerTask('endToEndTests', ['dalek']);
  grunt.registerTask('coverage', ['exec:coverage']);

  grunt.registerTask('default', ['browserify', 'jshint', 'unitTestsServer', 'unitTestsClient']);

};
