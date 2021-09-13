import { browser } from "$app/env";
import { Writable, writable } from "svelte/store";

import userInfo from "$lib/user";
import jsonp from "$lib/jsonp";
import type { ChartEntry } from "$lib/components/Donut.svelte";

import { Duration, LocalDateTime } from "@js-joda/core";

type Constructor<T> = () => T;
type Initializer<T> = T | Constructor<T>;

function local_store_read<T>(name: string): T | null {
  const stored: string = (browser && localStorage.getItem(name)) || null;

  if (stored !== null) {
    try {
      return JSON.parse(stored) as T;
    } catch (err) {
      console.error(name, err);
    }
  }

  return null;
}

function local_store_write(name: string, value: any) {
  if (browser) {
    if (typeof value === "string") {
      localStorage.setItem(name, value);
    } else {
      localStorage.setItem(name, JSON.stringify(value));
    }
  }
}

function update_expiry(name: string, duration: Duration): void {
  browser &&
    localStorage.setItem(
      name + ".timelock",
      JSON.stringify({
        valid_until: duration.addTo(LocalDateTime.now()),
      } as Timelock)
    );
}

function initialize_value<T>(init: Initializer<T>, set: (value: T) => void) {
  if (typeof init === "function") {
    set((init as () => T)());
  } else {
    set(init as T);
  }
}

export interface LocalStorageStore<T> extends Writable<T> {}

export function local_store<T>(
  name: string,
  init: Initializer<T>
): LocalStorageStore<T> {
  const { subscribe, set, update } = writable<T>();

  let result = {
    subscribe,
    set,
    update,
  } as LocalStorageStore<T>;

  result.set = (value: T) => {
    set(value);
    local_store_write(name, update);
  };

  let stored = local_store_read<T>(name);
  initialize_value(stored || init, result.set);

  return result;
}

interface Timelock {
  valid_until: LocalDateTime;
}

export interface TimedLocalStorageStore<T> extends Writable<T> {
  hasExpired: () => boolean;
}

export function time_limited_store<T>(
  name: string,
  init: Initializer<T>,
  duration: Duration
): TimedLocalStorageStore<T> {
  const { subscribe, set, update } = writable<T>();

  let result = {
    subscribe,
    set,
    update,
  } as TimedLocalStorageStore<T>;

  result.hasExpired = () => {
    const timelock: string =
      (browser && localStorage.getItem(name + ".timelock")) || null;

    if (timelock !== null) {
      let prev: Timelock = JSON.parse(timelock);

      if (prev.valid_until < LocalDateTime.now()) {
        return false;
      }
    }

    return true;
  };

  result.set = (value: T, expiry: boolean = false) => {
    set(value);
    local_store_write(name, value);
    if (expiry) {
      update_expiry(name, duration);
    }
  };

  if (!result.hasExpired()) {
    let stored = local_store_read<T>(name);
    initialize_value(stored || init, result.set);
  } else {
    initialize_value(init, result.set);
  }

  return result;
}

export async function async_time_limited_store<T>(
  name: string,
  init: () => Promise<T>,
  duration: Duration
): Promise<TimedLocalStorageStore<T>> {
  const { subscribe, set, update } = writable<T>();

  let result = {
    subscribe,
    set,
    update,
  } as TimedLocalStorageStore<T>;

  result.hasExpired = () => {
    const timelock: string =
      (browser && localStorage.getItem(name + ".timelock")) || null;

    if (timelock !== null) {
      let prev: Timelock = JSON.parse(timelock);

      return prev.valid_until < LocalDateTime.now();
    }

    return true;
  };

  result.set = (value: T) => {
    set(value);
    local_store_write(name, value);
  };

  if (!result.hasExpired()) {
    let stored = local_store_read<T>(name);
    initialize_value(stored || (await init()), result.set);
  } else {
    initialize_value(await init(), result.set);
    update_expiry(name, duration);
  }

  return result;
}

interface WakaTimeEntry {
  name: string;
  color: string;
  percent: number;
}

const IGNORE_LANGUAGES = [
  "other",
  "text",
  "markdown",
  "git config",
  "pacmanconf",
  "html",
  "ini",
  "xml",
  "yaml",
  "toml",
  "json",
  "gettext catalog",
];

const USED_LANGUAGES =
  "https://wakatime.com/share/@Caellian/ece394af-3d6b-43d3-8743-8f8b00426216.json";

async function get_languages(): Promise<ChartEntry[]> {
  var data: WakaTimeEntry[];

  try {
    data = (await jsonp(USED_LANGUAGES))["data"] as WakaTimeEntry[];
  } catch (error) {
    console.error("Unable to get data from WakaTime.");
    data = [];
  }

  var curr = 0;
  var total_weight = 0;
  const collected = [] as ChartEntry[];
  while (curr < data.length && curr < 10) {
    if (IGNORE_LANGUAGES.indexOf(data[curr].name.toLowerCase()) == -1) {
      total_weight += Math.round(data[curr].percent);
      collected.push({
        name: data[curr].name,
        color: data[curr].color,
        weight: Math.round(data[curr].percent),
      });
    }
    curr += 1;
  }

  if (collected.length > 0) {
    var recalc_total = 0;
    var biggest = collected[0];
    for (var e of collected) {
      e.weight = Math.round((e.weight / total_weight) * 100);
      recalc_total += e.weight;
      if (biggest.weight < e.weight) {
        biggest = e;
      }
    }

    if (recalc_total < 100) {
      biggest.weight += 100 - recalc_total;
    }
  }

  return collected;
}

export const languages = async_time_limited_store(
  "used-languages",
  get_languages,
  Duration.ofDays(3)
);
