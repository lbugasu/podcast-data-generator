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

def generate_color_palette(podcast):
  try:
    colors = []
    image = download_image(podcast['imageURL'])
    palette = get_color_palette(image)
    colors = first_3_colors(palette)
    podcast['palette'] = colors
  except Exception as error:
    log_error(podcast, error)
    podcast['palette'] = []
  return podcast

dist_directory = 'tmp/dist'

podcastsFolder = dist_directory + "/podcasts"
podcastFileNames = os.listdir(podcastsFolder)

podcasts = []
for podcastFile in podcastFileNames:
    podFile = open(podcastsFolder+'/'+podcastFile,'r')
    data = podFile.read()
    podcast = json.loads(data)
    if( 'imageURL' in podcast):
      podcast = generate_color_palette(podcast['imageURL'])
    podcasts.append(podcast)

    filepath = dist_directory + '/podcasts/' + podcast['title']+ '_with_palettes.json'

    with open(filepath,'w') as outputFile:
      outputFile.write(simplejson.dumps(podcast, indent=4, sort_keys=True))
    outputFile.close()

print('done')


logFile.close()
