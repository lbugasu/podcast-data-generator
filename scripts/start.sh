#!/bin/bash

# Download and Unzip Stanford CoreNLP
sh scripts/core-nlp-setup.sh

# Compile TypeScript Source
tsc

# Process Data
node out/index.js

pip3 install -r requirements.txt

python3 scripts/generate.py