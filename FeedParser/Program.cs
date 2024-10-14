// See https://aka.ms/new-console-template for more information
using System.Xml;
using System.Xml.Linq;
using CodeHollow.FeedReader;
using Newtonsoft.Json;
using OPMLCore.NET;
using PodcastDataGenerator.Models;
using Slugify;
using Syndication.Parser;

var workingDir = Directory.GetCurrentDirectory();//(Directory.GetCurrentDirectory());

List<WorkingFolder> folders = [
    new WorkingFolder("tmp/dist", ["podcasts","podcasts_palettes",".github/workflows"], ["tmp/dist/logs.md"]), 
    new WorkingFolder("dist", [], ["dist/rssUrls.txt"])
];

folders.ForEach(folder =>
{
    if (Directory.Exists($"{workingDir}/{folder.Path}"))
    {
        Directory.Delete($"{workingDir}/{folder.Path}", true);
    }
    Directory.CreateDirectory($"{workingDir}/{folder.Path}");
    folder.SubFolderPaths.ForEach(subFolderPath => Directory.CreateDirectory($"{workingDir}/{folder.Path}/{subFolderPath}"));
    folder.FilesToGenerate.ForEach(fileName => {
        using(File.Create($"{workingDir}/{fileName}")){}
    });
});


SlugHelper helper = new SlugHelper();

Opml opml = new Opml($"{workingDir}/data/podcasts_opml.xml");

foreach (Outline outline in opml.Body.Outlines)
{
    Console.WriteLine(outline.Text);
}

async Task<Feed?> ParseFeed(string xmlUrl)
{
    try
    {
        var parsedFeed = await FeedReader.ReadAsync(xmlUrl);
        Console.WriteLine($"Parsed Feed {parsedFeed.Title}");
        // How to remove #cdata-section when convert xml to json using Linq
        // https://gist.github.com/micheletolve/4b511875bfff23fe6970960d6ec3d175
        var doc = XElement.Parse(parsedFeed.OriginalDocument);
        var node_cdata = doc.DescendantNodes().OfType<XCData>().ToList();
        foreach (var node in node_cdata)
        {
            node.Parent.Add(node.Value);
            node.Remove();
        }
        var feedAsJson = JsonConvert.SerializeXNode(doc, Newtonsoft.Json.Formatting.Indented);
        File.WriteAllText($"{workingDir}/tmp/dist/podcasts/{helper.GenerateSlug(parsedFeed.Title)}.json", feedAsJson);

        return parsedFeed;

    }
    catch (System.Exception err)
    {

        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"Error fetching feed: {xmlUrl}: {err.Message}");
        Console.ResetColor();
        return null;
    }
}

var feeds = opml.Body.Outlines.First().Outlines;
File.AppendAllLines($"{workingDir}/dist/rssUrls.txt",feeds.Select(feed => feed.XMLUrl));
var parsedFeeds = feeds.Select(async feedItem => await ParseFeed(feedItem.XMLUrl));
await Task.WhenAll(parsedFeeds);
