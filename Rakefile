require 'fileutils'

def root_path
  File.dirname(__FILE__)
end

def version
  File.read(File.join(root_path, 'VERSION'))
end

namespace :dist do

  desc "Build json_search.js"
  task :json_search do
    FileUtils.cp(File.join(root_path, 'src', 'json_search.js'), File.join(root_path, 'dist', "json_search_#{version}.js"))
  end
  
  desc "Build All" 
  task :all => :json_search
end


desc "Run the specs"
task :spec do
  system("open #{File.join(root_path, 'spec', 'suite.html')}")
end
