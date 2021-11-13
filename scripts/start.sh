#!/bin/bash

# Download and Unzip Stanford CoreNLP
sh scripts/core-nlp-setup.sh

# Compile TypeScript Source
tsc

# Process Data
node out/index.js
