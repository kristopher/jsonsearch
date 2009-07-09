require 'fileutils'

def root_path
  File.dirname(__FILE__)
end

def version
  File.read(File.join(root_path, 'VERSION'))
end

desc "Build json_search.js"
task :dist do
  FileUtils.cp(File.join(root_path, 'src', 'json_search.js'), File.join(root_path, 'dist', "json_search.#{version}.js"))
  puts "\nGenerated distribution: dist/json_search.#{version}.js\n\n"
end
  
desc "Run the specs"
task :spec do
  system("open #{File.join(root_path, 'spec', 'suite.html')}")
end
