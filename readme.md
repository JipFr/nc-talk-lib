# Nextcloud Talk library in TypeScript for Deno

The purpose of this repository is to provide an easy way to make bots for Nextcloud Talk

To set it up, copy `example.env` into `.env` and replace the values with the proper information.

To start, run `deno --allow-net --allow-read main.ts`

## Basic example

A basic example of this would look like
```TypeScript
import { config } from "https://deno.land/x/dotenv/dotenv.ts";
const env = config();
import Talk from "./Talk/main.ts";
import { Message } from "./Talk/types.ts";

const client = new Talk(env["URL"]);

client.on("message", (evt: Message) => {
	console.log(`${evt.author.name}: ${evt.content}`);
});

client.login(env["USERNAME"], env["PASSWORD"]);
client.start();```