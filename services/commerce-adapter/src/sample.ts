import { createSampleEvent } from "./event.js";

process.stdout.write(`${JSON.stringify(createSampleEvent(), null, 2)}\n`);
