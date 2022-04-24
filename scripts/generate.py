from pathlib import Path
import json
import os
import simplejson
from colorthief import ColorThief
import urllib
import sys as sys
if sys.version_info <(3, 0):
    from urllib import urlopen
else:
    from urllib.request import urlopen
import io

def rgb_to_hex(r, g, b):
  return ('{:02X}' * 3).format(r, g, b)

def download_image(image_url):
  req = urllib.request.Request(image_url, headers={'User-Agent' : "Magic Browser"})
  con = urllib.request.urlopen( req )
  image = io.BytesIO(con.read())
  return image

def get_color_palette(imageBuffer):
  color_thief = ColorThief(imageBuffer)
  palette = color_thief.get_palette(color_count=6)
  return palette

def first_3_colors(palette):
  colors = []
  for color in palette:
    colors.append(rgb_to_hex(color[0], color[1], color[2]))
  return colors

logFile = open("tmp/dist/logs.md", "a")
logFile.write("## Color Palette Generation: \n")

def log_error(podcast, error):
  logFile.write("An exception occurred for: "+ podcast['title']+"\n: "+ str(error) + "\n")

def generate_color_palette(podcast_image):
  palette = []
  try:
    if ( 'url' in podcast_image):
      image = download_image(podcast_image['url'])
      palette = get_color_palette(image)
      palette = first_3_colors(palette)
  except Exception as error:
    log_error(podcast, error)
  return palette

dist_directory = 'tmp/dist'

podcastsFolder = dist_directory + "/podcasts"
podcastFileNames = os.listdir(podcastsFolder)

podcasts = []
for index, podcastFile in enumerate(podcastFileNames):
    podFile = open(podcastsFolder+'/'+podcastFile,'r')
    data = podFile.read()
    podcast = json.loads(data)
    palette = []
    if('image' in podcast):
      palette = generate_color_palette(podcast['image'])
    podcast['palette'] = palette

    filepath = dist_directory + '/podcasts_palettes/' + podcastFile[:-5]+ '_with_palettes.json'

    with open(filepath,'w') as outputFile:
      outputFile.write(simplejson.dumps(podcast, indent=4, sort_keys=True))
    outputFile.close()
    print("Generated palette for: %s - %.2f%% done" % (podcast['title'], ((index+1)/len(podcastFileNames)*100)))

print('\n🦩-------------Palette Generation Complete-------------🦜\n\n')


logFile.close()
