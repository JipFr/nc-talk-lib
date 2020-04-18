
import * as base64 from "https://denopkg.com/chiefbiiko/base64/mod.ts";

import { Message, Author, PeopleObject, Channel } from "./types.ts";


const startDate = Date.now();

/**
 * Event class
 * @param type Event type to listen for
 * @param callback Function to call when event is fired
 */
class Event {
	type: string;
	callback: Function;

	constructor(type: string, callback: Function) {
		this.type = type;
		this.callback = callback;
	}

}

/**
 * Options for the main Talk class
 * @param url Nextcloud installation's URL
 * @param username Nextcloud username
 * @param password Nextcloud password
 */
interface TalkOptions {
	url: string;
	username: string;
	password: string;
}

export { Message, Author, PeopleObject, Channel };
/**
 * Main talk class
 * @param people Cached people, followers PeopleObject interface
 * @param url Nextcloud installation's URL
 * @param headers Main request headers including authentication
 * @param channels List of channels the account is part of
 */
export default class Talk {
	public people: PeopleObject;
	public url: string;
	public headers: any;
	public channels: Channel[] = [];
	private lastMessageTimes: any;
	private events: Event[] = [];
	private userId: string | number;
	public user?: Author;


	constructor({ url, username, password }: TalkOptions) {

		this.url = url;
		this.lastMessageTimes = {};
		this.people = {};
		this.userId = -1;
		this.headers = {
			"Ocs-Apirequest": "true",
			"Accept": "application/json, text/plain, */*"
		}

		let usernamePassword = `${username}:${password}`;
		this.userId = username;
		this.headers.Authorization = `Basic ${base64.fromUint8Array(new TextEncoder().encode(usernamePassword))}`;

	}

	/**
	 * Start listening for messages and other events
	 */
	public async start() {
		await this.loop();
	}

	// Main loop
	private async loop() {
		await this.updateRooms();
		setTimeout(() => {
			this.loop();
		}, 2e3);
	}

	// Check for new messages
	private async updateRooms() {
		let data = await (await fetch(
			`https://${this.url}/ocs/v2.php/apps/spreed/api/v1/room`,
			{
				headers: this.headers
			}
		)).json();
		let rooms = data.ocs.data;

		this.channels = [];

		for(let room of rooms) {

			Object.keys(room.participants).forEach((personId: string) => {
				
				let participant = room.participants[personId];
				this.people[personId] = new Author({
					name: participant.name,
					id: personId,
					type: participant.type
				});

				if(this.people[this.userId]) {
					this.user = this.people[this.userId];
				}

			});

			room.lastMessage.timestamp *= 1e3;

			if(room.lastMessage.timestamp > this.getLastMessageTime(room.token)) {
				
				await this.updateRoom(room);
			}

			let channel = new Channel(room);
			this.channels.push(channel);

		}

	}

	// Update specific room and emit messages
	private async updateRoom(room: any) {
		
		let channel = new Channel(room);
		let roomToken = room.token;

		let data = await (await fetch(
			`https://${this.url}/ocs/v2.php/apps/spreed/api/v1/chat/${roomToken}?lookIntoFuture=0&includeLastKnown=1`,
			{
				headers: this.headers
			}
		)).json();

		let messages = data.ocs.data;
		let lastMessageTime = this.getLastMessageTime(roomToken);
		messages = messages.filter((msg: any) => lastMessageTime < (msg.timestamp * 1e3));

		for(let message of messages) {
			channel.client = this;
			message.channel = channel;
			this.emitMessageEvent(message);
		}

		this.lastMessageTimes[roomToken] = Date.now();
	}

	// Get an untypes message event
	// type it, then emit the event
	private emitMessageEvent(message: any) {
		// First, we need to convert the message so it's actually a Message type
		message = this.toMessage(message);
		this.emit("message", message);
		
	}

	// Convert untyped room to Channel
	private toChannel(room: any): Channel | null {
		return new Channel(room);
	}

	// Convert untyped message object to Message
	private toMessage(message: any): Message | void {

		let quoted: Message | null | void = null;
		if(message.parent) {
			quoted = this.toMessage(message.parent);
		}

		return new Message({
			...message,
			channel: message.channel,
			content: message.message,
			timestamp: message.timestamp,
			authorId: message.actorId,
			id: message.id,
			parameters: message.messageParameters,
			quoted
		}, this.people);
	}

	// Get time of last message in room
	private getLastMessageTime(roomId: string): number {
		return this.lastMessageTimes[roomId] || startDate;
	}


	/*
	 * EVENTS
	 */

	/**
	 * Create new event
	 * @param type Event type to listen for. For example, `message`.
	 * @param callback Callback function to fire when event is triggered
	 */
	public on(type: string, callback: Function) {
		let event = new Event(type, callback);
		this.events.push(event);
	}

	// Emit event
	private emit(type: string, value: any) {
		let listeners = this.events.filter((evt: Event) => evt.type === type);
		listeners.forEach((event: Event) => {
			event.callback(value);
		});
	}


}