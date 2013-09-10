require 'bundler/setup'
require 'haml'
require 'sinatra/base'
require 'sinatra/partial'
require 'sinatra/json'
require 'yaml'

class App < Sinatra::Base
  register Sinatra::Partial

  MANIFEST = YAML.load_file("#{settings.views}/manifest.yml")

  helpers do
    def part(name, attrs = {})
      partial("partials/#{name}", :locals => { :attrs => attrs })
    end

    def get_article_path
      File.join('articles', params[:year], params[:month], params[:day], params[:name])
    end

    def get_css_filepath
      File.join(settings.public_folder, 'css','articles', params[:filename])
    end
  end

  head '/css/articles/:filename' do
    halt File.exists?(get_css_filepath) ? 200 : 204
  end

  get '/style/:name' do
    file = get_article_css_filename

    if File.exists?(file)
      halt 200
    else
      halt 204
    end
  end

  get '/article/:year/:month/:day/:name' do
    if params[:name] =~ /^demo[0-9]+/
      if request.xhr?
        return haml :demo, :layout => false
      else
        return haml :demo
      end
    end

    view = get_article_path

    if File.exists?(File.join(settings.views, "#{view}.haml"))
      if request.xhr?
        haml :"#{view}", :layout => false
      else
        haml :"#{view}"
      end
    else
      raise Sinatra::NotFound
    end
  end

  get '/manifest.json' do
    json MANIFEST
  end

  get '/' do
    haml :index
  end
end
