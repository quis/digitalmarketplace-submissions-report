module.exports = function(grunt){

  grunt.initConfig({

    // Builds SASS
    sass: {
      dev: {
        options: {
          style: "expanded",
          sourcemap: true,
          includePaths: [
            'govuk_modules/govuk_template/assets/stylesheets',
            'govuk_modules/govuk_frontend_toolkit/stylesheets'
          ]
        },
        files: [{
          expand: true,
          cwd: "app/assets/sass",
          src: ["*.scss"],
          dest: "public/stylesheets/.temp", // Put stylesheet in temp place for other tasks to work on
          ext: ".css"
        }]
      },
      production: {
        options: {
          style: "compressed",
          sourceMap: false,
          includePaths: [
            'govuk_modules/govuk_template/assets/stylesheets',
            'govuk_modules/govuk_frontend_toolkit/stylesheets'
          ]
        },
        files: [{
          expand: true,
          cwd: "app/assets/sass",
          src: ["*.scss"],
          dest: "public/stylesheets",
          ext: ".css"
        }]
      }
    },

    // Copies templates and assets from external modules and dirs
    copy: {

      bower_js: {
        cwd: 'bower_components/',
        src: ['c3/c3.js', 'd3/d3.js'],
        dest: 'public/scripts/',
        expand: true,
        flatten: true
      },

      bower_css: {
        cwd: 'bower_components/',
        src: ['c3/c3.css'],
        dest: 'public/styles/',
        expand: true,
        flatten: true
      },

    },

    uglify: {
      production: {
        options: {
          sourceMap: false,
          mangle: true,
          compress: true,
          preserveComments: false
        },
        files: {
          "public/javascripts/application.js": []
        }
      }
    },

  });

  // Automatically loads any grunt-* tasks in your package.json
  require("load-grunt-tasks")(grunt);

  grunt.registerTask('default', [
    'copy'
  ]);
};
