class ArticleCompiler
  class << self
    BLOCK_MATCHER   = /\/\*!\s*articles/
    ARTICLE_MATCHER = /\/\*!\s*article/

    def create_article_stylesheets(filename)
      block_started = false

      main    = []
      aname   = nil
      article = nil

      File.open(filename, 'r') do |file|
        file.each_line do |line|
          if line =~ BLOCK_MATCHER
            block_started = true
            next
          end

          if block_started
            if line =~ ARTICLE_MATCHER && !(line =~ BLOCK_MATCHER)
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

      File.open(filename, 'w') do |file|
        file.write(main.join(''))
      end
    end

    def write_article_file(aname, lines)
      fname = File.join(File.expand_path("../../public/css/articles", __FILE__), aname)
      File.open(fname, 'w') do |file|
        file.write(lines.join(''))
      end
    end

    def get_article_name(line)
      line.scan(/^*article:(.*)\*\/$/).flatten.first.strip
    end
  end
end
