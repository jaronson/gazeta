f = ARGV.shift
d = File.read(f).split("\n")
o = []
i = 0

d.each do |l|
  if l =~ /<point/
    l = l.gsub(/index="[0-9]+"/,'')
    l = l.gsub('<point', "<point index=\"#{i}\"")
    i += 1
  end
  o << l
end

puts o.join("\n")
