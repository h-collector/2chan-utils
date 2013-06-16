#!/bin/sh

name=2chan-utils
#extact comments info
sed -n '/^\/\//p' "src/${name}.js" > "/tmp/${name}.info"
desc=$(sed -n 's/.*@description\s*//p' src/${name}.js)
version=$(sed -n 's/.*@version\s*//p' src/${name}.js)
#uglify
uglifyjs "src/${name}.js" --screw-ie8 --stats --lint -mvc -o "/tmp/${name}.ugly.js"
#merge info and uglified script
cat "/tmp/${name}.info" "/tmp/${name}.ugly.js" > "src/includes/${name}.js"
#make config.xml
#cat << 'EOF' > src/config.xml #doesnt eval output
(cat << EOF
<?xml version="1.0" encoding="utf-8"?>
<widget xmlns="http://www.w3.org/ns/widgets" version="${version}" id="extensions:${name}">
	<name>${name}</name>
	<description>${desc}</description>
	<author href="https://gist.github.com/h-collector/">h-collector &lt;githcoll@gmail.com&gt;</author>
</widget>
EOF
) > src/config.xml
#zip to opera extension
cd src
zip "../build/${name}.oex" config.xml index.html "includes/${name}.js"
cd ..