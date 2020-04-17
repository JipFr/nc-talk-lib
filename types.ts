
import Talk from "./main.ts";

/*
 * Other
 */

export interface PeopleObject {
	[key: string]: Author;
}

/*
 * Message types
 */

interface MessageOptions {
	content: string;
	timestamp: number;
	authorId: string;
	id: number;
	parameters: any;
	isReplyable: boolean;
	quoted: Message | void;
	channel: Channel;
}

export class Message {

	id: number;
	content: string;
	timestamp: Date;
	author: Author;
	parameters: any;
	isReplyable: boolean;
	quoted: Message | void;
	channel: Channel;

	constructor({
		content, channel, timestamp,
		authorId, id, parameters,
		isReplyable, quoted
	}: MessageOptions, knownPeople: PeopleObject) {
		this.content = content;
		this.timestamp = new Date(timestamp * 1e3);
		this.id = id;
		this.parameters = parameters;
		this.isReplyable = isReplyable;

		this.author = knownPeople[authorId] || null;
		this.quoted = quoted;
		this.channel = channel;

	}

	// Reply to someone
	public async reply(input: string | SendOptions) {
		
		if(typeof input === "string") {
			input = {
				content: input
			}
		}
		

		this.channel.send({
			content: input.content,
			quote: this.id
		});
	}

}

/*
 * Author types
 */
interface AuthorOptions {
	name: string;
	id: string;
	type: number;
}

export class Author {
	public name: string;
	public id: string;
	public type: number;

	constructor({ name, id, type }: AuthorOptions) {
		this.name = name;
		this.id = id;
		this.type = type;
	}

}

/* 
 * Channel types
 */

interface ChannelOptions {
	name: string;
	token: string;
	displayName: string;
	readOnly: number; // ????
	hasPassword: boolean;
	hasCall: boolean;
	isFavorite: boolean;
	notificationLevel: number;
	unreadMessages: number;
	unreadMention: boolean;
}

export class Channel {

	public name: string;
	public token: string;
	public displayName: string;
	public readOnly: number; // ????
	public hasPassword: boolean;
	public hasCall: boolean;
	public isFavorite: boolean;
	public notificationLevel: number;
	public unreadMessages: number;
	public 	unreadMention: boolean;
	public client?: Talk; // I'd rather not do this, but idk if I have a choice

	constructor({
		name,
		token,
		displayName,
		readOnly,
		hasPassword,
		hasCall,
		isFavorite,
		notificationLevel,
		unreadMessages,
		unreadMention
	}: ChannelOptions) {
		this.name = name;
		this.token = token;
		this.displayName = displayName;
		this.readOnly = readOnly;
		this.hasPassword = hasPassword;
		this.hasCall = hasCall;
		this.isFavorite = isFavorite;
		this.notificationLevel = notificationLevel;
		this.unreadMessages = unreadMessages;
		this.unreadMention = unreadMention;
	}

	// Send function, send message in channel
	public send(input: string | SendOptions) {

		if(typeof input === "string") {
			input = {
				content: input
			}
		}

		let messageForm = new FormData();
		messageForm.append("message", input.content);
		if(input.quote) messageForm.append("replyTo", input.quote.toString());

		if(this.client) {
			fetch(`https://${this.client.url}/ocs/v2.php/apps/spreed/api/v1/chat/${this.token}`, {
				method: "POST",
				headers: this.client.headers,
				body: messageForm
			});
		} else {
			console.log("NO CLIENT");
		}

	}


}

interface SendOptions {
	content: string;
	quote?: number;
}