import sourceMap from "source-map-support";
sourceMap.install();

import "./src/env.js";
import main from "./src/main.js";

await main();
