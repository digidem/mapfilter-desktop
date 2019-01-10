#!/bin/sh

# For Linux we need to preload zlib because otherwise electron links to system
# zlib which on debian is 1.2.8, which has security issues and is incompatible
# with libpng. See https://github.com/lovell/sharp/issues/892

# IMPORTANT: If you change the app name, you need to change the folder and
# executable names here

LD_PRELOAD=/usr/lib/tizii-tizii/resources/app/node_modules/sharp/vendor/lib/libz.so /usr/lib/tizii-tizii/tizii-tizii
