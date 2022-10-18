#!/usr/bin/sh

ANSWERS="art/answer"
ICONS="art/icons"

function del_attrib() {
    echo "$1" | sed -E "s/\s*$2=\"[^\"]*\"\s*/ /g"
}

function replace_attrib() {
    echo "$1" | sed -E "s/\s*$2=\"[^\"]*\"\s*/ $2=$3 /g"
}

function proc_dir() {
    for f in $1/*.svg; do
        content=$(svgo $f -o -)
        dim=$(printf "%.0f\n" $(echo $content | grep -Po '(?<=width=")[0-9\.]+(?=")' | head -n1 | sed "s/\./,/g"))

        inner=$(echo $content | grep -Po '<svg [^>]+>\K(.(?!<\/svg>))+>(?=<\/svg>)')
        inner=$(del_attrib "$inner" "id")
        inner=$(del_attrib "$inner" "style")
        inner=$(replace_attrib "$inner" "stroke" "\"var(--color)\"")
        inner=$(replace_attrib "$inner" "fill" "\"var(--color)\"")
        inner=$(echo $inner | sed "s/\"/\\\\\"/g")

        name=$(echo $f | grep -Po "$1/\K[^.]+(?=\.svg)" )
        echo -ne "\"${name}\":{\"dim\":$dim,\"content\":\"$inner\"},"
    done
}

icon_json=$(proc_dir $ICONS)

echo -e "{$icon_json}" > ./src/lib/icons.json
prettier -w ./src/lib/icons.json
