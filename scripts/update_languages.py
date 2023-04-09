#!/usr/bin/env python3

import datetime
import pytz
from dateutil.parser import parse

import json
import socket

from aw_core.models import Event
from aw_client import ActivityWatchClient

VSCODE_BUCKET = "aw-watcher-vscode"
CLION_BUCKET = "aw-watcher-CLion"
BUCKETS = [VSCODE_BUCKET, CLION_BUCKET]

PRETTY_DATA = {
    "javascript": {
        "name": "JavaScript",
        "color": "#fff651",
    },
    "typescript": {
        "name": "TypeScript",
        "color": "#3178c6",
    },
    "svelte": {
        "name": "SvelteKit",
        "color": "#ff7517",
    },
    "rust": {
        "name": "Rust",
        "color": "#ff9047",
    },
    "python": {
        "name": "Python",
        "color": "#96ef8d",
    },
    "shellscript": {
        "name": "Shell",
        "color": "#84b5c9",
    },
    "go": {
        "name": "Go",
        "color": "#68d5f3",
    },
    "stylus": {
        "name": "Stylus",
        "color": "#ff6347",
    },
    "css": {
        "name": "CSS",
        "color": "#3582ca",
    },
    "GLSL shader": {
        "name": "GLSL",
        "color": "#18b3e7",
    },
    # "html": {
    #    "name": "HTML",
    #    "color": "#39B0ff",
    # },
}


def main():
    languages = {}
    skipped = ['unknown']
    total = datetime.timedelta(0)

    tz = pytz.timezone('Europe/Zagreb')
    today = datetime.datetime.now(tz)
    if today.month > 1:
        last_month = today.replace(month=today.month - 1)
    else:
        last_month = today.replace(year=today.year - 1, month=12)

    first_event = today

    hostname = socket.gethostname()

    with ActivityWatchClient("collect-languages-client") as client:

        for bucket in BUCKETS:
            bucket_id = f"{bucket}_{hostname}"

            # TODO: Intersect window active
            query = f"""afk_events = query_bucket(find_bucket("aw-watcher-afk_{hostname}"));
            bucket_events = query_bucket(find_bucket("{bucket_id}"));
            intersection_events = filter_period_intersect(bucket_events, filter_keyvals(afk_events, "status", ["not-afk"]));
            RETURN = merge_events_by_keys(intersection_events, ["language"]);
            """

            events = client.query(query, [(last_month, today)])[0]

            for event in events:
                timestamp = parse(event["timestamp"])
                if timestamp < first_event:
                    first_event = timestamp

                duration = datetime.timedelta(seconds=event["duration"])
                language = event["data"]["language"]

                if language.lower() in PRETTY_DATA.keys():
                    info = PRETTY_DATA[language.lower()]
                    language = info["name"]

                    if language not in languages:
                        languages[language] = {
                            "color": info["color"],
                            "time": datetime.timedelta(0),
                        }

                    languages[language]["time"] += duration
                    total += duration
                else:
                    if language not in skipped:
                        print(f"- Skipped '{language}'")
                        skipped.append(language)

    for language in languages:
        time = languages[language]["time"]
        languages[language]["name"] = language
        languages[language]["weight"] = time.total_seconds() / \
            total.total_seconds() * 100

    languages = {l: languages[l] for l in filter(
        lambda l: languages[l]["weight"] >= 0.1, languages)}

    result = []
    print(f"\nUsed languages ({first_event} -> {today}):")
    for language in languages:
        time = languages[language].pop("time")
        result.append(languages[language])
        print(f"- {language}: {languages[language]['weight']:.2f}% ({time})")

    with open("src/lib/used_languages.json", "w") as target:
        json.dump(result, target)


if __name__ == "__main__":
    main()
