import { nanoid } from "nanoid";
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from "slash-create";
import { BotClient } from "../types";

export default class Start extends SlashCommand<BotClient> {
	constructor(creator: SlashCreator) {
		super(creator, {
			name: "start",
			description: "Start a multiplayer browser session",
			options: [
				{
					type: CommandOptionType.STRING,
					name: "start_url",
					description: "The initial URL that is set in the browser",
				},
				{
					type: CommandOptionType.STRING,
					name: "region",
					description: "The region to use for the session",
					choices: [
						{
							name: "North America",
							value: "NA",
						},
						{
							name: "Europe",
							value: "EU",
						},
						{
							name: "Asia",
							value: "AS",
						},
					],
				},
			],
		});
		this.filePath = __filename;
	}

	async run(ctx: CommandContext) {
		const start_url = ctx.options.start_url;
		const response = await fetch("https://enginetest.hyperbeam.com/v0/vm", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.HYPERBEAM_API_KEY}`,
			},
			body: JSON.stringify({
				start_url: start_url
					? this.hasProtocol(start_url)
						? start_url
						: `https://duckduckgo.com/?q=${encodeURIComponent(start_url)}`
					: "https://duckduckgo.com",
				offline_timeout: 300,
				region: ctx.options.region || "NA",
			}),
		});
		if (!response.ok) {
			return ctx.send("Something went wrong! Please try again.", { ephemeral: true });
		}
		const room_id = nanoid();
		const hb_session_id: string = await response.json().then(data => data.session_id);
		await this.client.db.room.create({ data: { room_id, hb_session_id } });
		return ctx.send(
			`Started a multiplayer browser session at ${process.env.VITE_CLIENT_BASE_URL}/rooms/${room_id}`,
		);
	}

	hasProtocol(s: string) {
		try {
			const url = new URL(s);
			return url.protocol === "https:" || url.protocol === "http:";
		} catch (e) {
			return false;
		}
	}
}