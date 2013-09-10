class ArticleCompiler
  class << self
    START_MATCHER   = /\/\*!\s*articles-start/
    END_MATCHER     = /\/\*!\s*articles-end/
    ARTICLE_MATCHER = /\/\*!\s*article/

    def create_article_stylesheets(filename)
      block_started = false

      main    = []
      aname   = nil
      article = nil

      File.open(filename, 'r') do |file|
        file.each_line do |line|
          if line =~ START_MATCHER
            block_started = true
            next
          end

          if block_started
            if (line =~ ARTICLE_MATCHER || line =~ END_MATCHER)
              if !article.nil?
                write_article_file(aname, article)
              end
              aname   = get_article_name(line)
              article = []
            end

            article << line
          else
            main << line
          end
        end
      end

      puts "writing #{filename}"

      File.open(filename, 'w') do |file|
        file.write(main.join(''))
      end
    end

    def write_article_file(aname, lines)
      puts "writing #{aname}"

      fname = File.join(File.expand_path("../../public/css/articles", __FILE__), aname)
      File.open(fname, 'w') do |file|
        file.write(lines.join(''))
      end
    end

    def get_article_name(line)
      line.scan(/^*article:(.*)\*\/$/).flatten.first.strip rescue nil
    end
  end
end
