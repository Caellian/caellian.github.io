import type { ZonedDateTime } from "@js-joda/core";

export interface Post {
  title: string;
  description: string;
  url: string;
  published: ZonedDateTime;
  last_edit: ZonedDateTime;
  body: HTMLElement;
}
