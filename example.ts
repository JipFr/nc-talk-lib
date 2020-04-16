
import { config } from "https://deno.land/x/dotenv/dotenv.ts";
const env = config();

import Talk from "./Talk/main.ts";
import { Message } from "./Talk/types.ts";

const client = new Talk(env["URL"]);

client.on("message", (evt: Message) => {
	console.log(`${evt.author.name}: ${evt.content}`);
	
	if(evt.content === "zeg is") {
		console.log("Replying, if there's a func");
		evt.channel.send("Hello!");
	}

	if(evt.content.toLowerCase().startsWith("zeg:")) {
		let txt = evt.content.slice(4).trim()
		evt.channel.send(txt);
	}

	if(evt.content.toLowerCase() === "ping") {
		evt.reply("Pong!");
	}

});


client.login(env["USERNAME"], env["PASSWORD"]);
client.start().then(() => {
	console.log("Started");
});