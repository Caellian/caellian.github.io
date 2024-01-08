#!/usr/bin/env python3

import re
import os
import json
import subprocess
import xml.etree.ElementTree as ET

ICONS = "art/icons"
DEST = "src/data/icons.json"

SVG_NS = "http://www.w3.org/2000/svg"

def simplified(source):
    result = subprocess.run(["svgo", f"./art/icons/{source}", "-o", "-"], encoding="utf-8", stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    result.check_returncode()
    return result.stdout

def cleanup_colors(root):
    """Cleans up the colors in the svg file"""
    
    for node in root.iter():
        if 'style' in node.attrib:
            del node.attrib['style']

        if 'fill' in node.attrib:
            if node.attrib['fill'] != 'none':
                node.attrib['fill'] = 'var(--icon-fill, var(--icon-color))'
        else:
            node.attrib['fill'] = 'none'
        if 'stroke' in node.attrib:
            if node.attrib['stroke'] != 'none':
                node.attrib['stroke'] = 'var(--icon-stroke, var(--icon-color))'
        else:
            node.attrib['stroke'] = 'none'

def main():
    if not os.path.exists(ICONS):
        print("Icons directory does not exist!")
        return

    if os.path.exists(DEST):
        print("Icons already built!")
        return

    icons = os.listdir(ICONS)

    results = {}

    for icon in icons:
        name = icon.split('.')[0]
        print(f"Processing '{name}' icon...")
        icon = simplified(icon)
        icon = re.sub(' xmlns="[^"]+"', '', icon, count=1)
        root = ET.fromstring(icon)
        size = int(root.attrib['width'])
        cleanup_colors(root)

        content = ""
        for item in root:
            content += ET.tostring(item, encoding='utf-8').decode('utf-8')

        results[name] = {
            'dim': size,
            'content': content
        }

    json.dump(results, open(DEST, 'w'))
    print("Done!")

if __name__ == '__main__':
    main()