#!/bin/sh
set -e

cd ./src/app

echo 'window.SCHEMA=' > ./schema.json.js
cat ../schema.json >> ./schema.json.js

cp ../index.html ../service-worker.js ./

for lib in lib/*.js
    do sed -i "s|</head>|<script src='./${lib}'></script></head>|" ./index.html
done

for mod in *.js
    do sed -i "s|<body>|<body><script src='./${mod}'></script>|" ./index.html
done

for file in *.* lib/*.* lib/*/*.*
    do sed -i "s|//files//|'/${file}', //files//|" ./service-worker.js
done
