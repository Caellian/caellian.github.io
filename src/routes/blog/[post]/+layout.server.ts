import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({}) => {
  return {
    posts: [
      {
        title: "a",
        slug: "b",
      },
    ] as Post[],
    names: {},
  };
};
