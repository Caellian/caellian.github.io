import { error, json } from "@sveltejs/kit";

import fs from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";
import { resolveAliasPath } from "$lib/local";

function cleanupColors($, svg) {
  svg.find("*").each((_, el) => {
    const element = $(el);

    // Remove 'id' attribute
    element.removeAttr("id");

    // Normalize 'fill' attribute
    if (element.attr("fill")) {
      element.attr(
        "fill",
        element.attr("fill") !== "none"
          ? "var(--icon-fill, var(--icon-color))"
          : "none"
      );
    } else {
      element.attr("fill", "none");
    }

    // Normalize 'stroke' attribute
    if (element.attr("stroke")) {
      element.attr(
        "stroke",
        element.attr("stroke") !== "none"
          ? "var(--icon-stroke, var(--icon-color))"
          : "none"
      );
    } else {
      element.attr("stroke", "none");
    }

    // Update 'style' attribute
    const style = element.attr("style");
    if (style) {
      const styles = style
        .split(";")
        .map((rule) => {
          const [name, value] = rule.split(":").map((item) => item.trim());
          if (name === "fill") {
            return value !== "none"
              ? `${name}:var(--icon-fill, var(--icon-color))`
              : `${name}:none`;
          } else if (name === "stroke") {
            return value !== "none"
              ? `${name}:var(--icon-stroke, var(--icon-color))`
              : `${name}:none`;
          }
          return `${name}:${value}`;
        })
        .join(";");
      element.attr("style", styles);
    }
  });
}

function removeWhitespace(input) {
  return input
    .replace(/\s+/g, " ")
    .replace(/\/>\s+</g, "/><")
    .replace(/\/((\w+:)?\w+)>\s+</g, "/$1><")
    .trim();
}

/** Handler for processing icons */
async function processIcon(iconFile) {
  const iconPath = path.join(resolveAliasPath("$icons"), iconFile);
  const iconContent = await fs.readFile(iconPath, { encoding: "utf-8" });

  const dom = cheerio.load(iconContent, { xmlMode: true });
  const svg = dom("svg");

  const size = parseInt(svg.attr("width") || svg.attr("height"), 10);
  cleanupColors(dom, svg);
  let content = svg.html();
  content = removeWhitespace(content);

  return { dim: size, content };
}

export const prerender = true;

export async function GET() {
  let iconFiles = null;
  const iconsPath = resolveAliasPath("$icons");
  try {
    iconFiles = await fs.readdir(iconsPath);
  } catch {
    return error(404, {
      message: `icons directory not found: ${iconsPath}`,
    });
  }

  const icons = {};

  for (const iconPath of iconFiles) {
    const name = path.basename(iconPath, ".svg");
    icons[name] = await processIcon(iconPath);
  }

  return json(icons, {
    headers: {
      "cache-control": "max-age=3600, s-maxage=3600",
    },
  });
}
