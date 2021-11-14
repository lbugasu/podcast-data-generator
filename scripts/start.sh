# Prepare folders
echo 'Prepare 🧑‍🍳'
rm -rf tmp/
mkdir tmp
mkdir tmp/dist
touch tmp/dist/logs.md
mkdir tmp/dist/feeds
mkdir tmp/dist/podcasts
mkdir tmp/dist/podcasts_ne
mkdir tmp/dist/podcasts_ne_n_palettes

echo 'Download Stanford CoreNLP 🏋️'
# Download Stanford CoreNLP
wget -P tmp "https://downloads.cs.stanford.edu/nlp/software/stanford-ner-4.2.0.zip"

# Unzip to tmp/folder
unzip tmp/stanford-ner-4.2.0.zip -d tmp/

# Download Python packages
pip3 install -r requirements.txt
# Install node packages
npm install

# Compile TypeScript Source
tsc

echo 'Process w/ Name Entity Recognition 🤖'
node --optimize_for_size --max_old_space_size=4096 out/index.js

echo 'Generate Palette 🎨'
python3 scripts/generate.py

echo 'Prepare distribution ;)'
cp -r tmp/dist dist/
cp LICENSE.txt dist/LICENSE.txt
cp docs/dataReadMe.md dist/ReadMe.txt
