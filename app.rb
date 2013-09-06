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
  end

  get '/article/:year/:month/:day/:name' do
    if params[:name] =~ /^demo[0-9]+/
      return haml :demo, :layout => false
    end

    view = get_article_path

    if File.exists?(File.join(settings.views, "#{view}.haml"))
      haml :"#{view}", :layout => false
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
