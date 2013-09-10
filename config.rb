require 'sass-globbing'
require 'zurb-foundation'
require File.expand_path('../lib/article_compiler', __FILE__)

Sass::Script::Number.precision = 8

http_path       = "/"
css_dir         = "public/css"
sass_dir        = "sass"
images_dir      = "public/img"
javascripts_dir = "public/js"

on_stylesheet_saved do |filename|
  ArticleCompiler.create_article_stylesheets(filename)
end

# You can select your preferred output style here (can be overridden via the command line):
# output_style = :expanded or :nested or :compact or :compressed
output_style = :compact

# To enable relative paths to assets via compass helper functions. Uncomment:
relative_assets = true

# To disable debugging comments that display the original location of your selectors. Uncomment:
line_comments = false

# If you prefer the indented syntax, you might want to regenerate this
# project again passing --syntax sass, or you can uncomment this:
# preferred_syntax = :sass
# and then run:
# sass-convert -R --from scss --to sass sass scss && rm -rf sass && mv scss sass
