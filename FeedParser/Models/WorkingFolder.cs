namespace PodcastDataGenerator.Models
{
    public class WorkingFolder
    {
        public string Path {get; set;}
        public List<string> SubFolderPaths { get; set;}
        public List<string> FilesToGenerate { get; set;}
        public WorkingFolder(string path, List<string> subFolderPaths, List<string> filesToGenerate)
        {
            Path = path;
            SubFolderPaths = subFolderPaths;
            FilesToGenerate = filesToGenerate;
        }
    }
}