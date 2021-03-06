require 'sinatra/partial'
require 'sinatra/json'
require 'yaml'

module Sinatra
module Gazeta
  module Helpers
    def part(name, attrs = {})
      partial("partials/#{name}", :locals => { :attrs => attrs })
    end

    def get_manifest
      Gazeta.manifest("#{settings.views}/manifest.yml")
    end

    def get_article_path
      File.join('articles', params[:year], params[:month], params[:day], params[:name])
    end

    def get_public_file_path(type, filename)
      File.join(settings.public_folder, type.to_s, 'articles', filename)
    end

    def view_file_exists?(view)
      File.exists?(File.join(settings.views, "#{view}.haml"))
    end

    def public_file_exists?(type, filename)
      File.exists?(get_public_file_path(type, filename))
    end

    def render_demo_article
      if request.xhr?
        haml :demo, :layout => false
      else
        haml :demo
      end
    end
  end

  def self.manifest(path)
    @@manifest ||= YAML.load_file(path)
  end

  @@manifest = nil

  def self.registered(app)
    app.register(Sinatra::Partial)
    app.helpers(Gazeta::Helpers)

    [ :css, :js ].each do |type|
      app.head "/#{type}/articles/:filename.#{type}" do
        halt public_file_exists?(type, params[:filename]) ? 200 : 204
      end
    end

    app.get '/article/:year/:month/:day/:name*' do
      if params[:name] =~ /^demo[0-9]+/
        return render_demo_article
      end

      view = get_article_path

      if view_file_exists?(view)
        opts = request.xhr? ? { :layout => false } : {}
        haml :"#{view}", opts
      else
        raise Sinatra::NotFound
      end
    end

    app.get '/manifest.json' do
      manifest  = get_manifest
      subdomain = request.host.split('.').first.to_sym

      if manifest[subdomain]
        json manifest[subdomain]
      else
        json manifest[:default]
      end
    end

    app.get '/' do
      haml :index
    end
  end
end
end
