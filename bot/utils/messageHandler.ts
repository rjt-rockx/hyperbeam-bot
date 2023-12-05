// so the idea is, on running the start commmand, if the chat flag is set, it should start watching messages in the channel
// we need to fetch the message from discord via the discord.js client and dispatch it to the room

import { matchMaker, Room } from "colyseus";

import { BotClient } from "../types";

const activeListeners: Map<string, Array<Room>> = new Map();

export function addListener(channelId: string | null, sessionId: string) {
	if (!channelId || !sessionId) return;

	const room = matchMaker.getRoomById(sessionId);
	if (!room) return;

	if (!activeListeners.has(channelId)) activeListeners.set(channelId, [room]);
	else {
		let listeners = activeListeners.get(channelId);
		if (!listeners) listeners = [];
		if (!listeners.find((r) => r.roomId === room.roomId)) listeners.push(room);
		activeListeners.set(channelId, listeners);
	}
}

export function removeListener(channelId: string | null, sessionId: string) {
	if (!channelId || !sessionId) return;
	if (!activeListeners.has(channelId)) return;
	else {
		let listeners = activeListeners.get(channelId);
		if (!listeners) listeners = [];
		listeners = listeners.filter((r) => r.roomId !== sessionId);
		if (!listeners.length) activeListeners.delete(channelId);
		else activeListeners.set(channelId, listeners);
	}
}

export async function initialize(client: BotClient) {
	client.on("messageCreate", async (message) => {
		if (!activeListeners.has(message.channelId)) return;

		const listeners = activeListeners.get(message.channelId);
		if (!listeners?.length) return;

		const messageData = await message.toJSON();
		const authorData = await message.author?.toJSON();

		for (const room of listeners) {
			if (!room) continue;
			room.broadcast("discordMessageCreate", {
				message: messageData,
				author: authorData,
			});
		}
	});
}

export default { initialize, addListener, removeListener };
