import dotenv from "dotenv";
import { SlashCreator, GatewayServer } from "slash-create";
import { ActivityType, Client, GatewayDispatchEvents, GatewayIntentBits } from "discord.js";
import path from "path";
import database from "./classes/database";
import server from "./classes/api";
import { BotClient } from "./types";
import { updateUser } from "./classes/discord";
import { restartActiveSessions } from "./classes/sessions";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const port = parseInt(process.env.VITE_API_SERVER_PORT || "3000", 10);
server.listen(port).then(async () => {
	console.log(`API server listening on port ${port}`);
	await restartActiveSessions().then((sessions) => {
		if (sessions.length) console.log(`Restarted ${sessions.length} sessions`);
	});
});

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
}) as BotClient;
client.db = database;

const setActivity = (user: typeof client.user) =>
	user?.setActivity({
		name: "/start to start browsing!",
		type: ActivityType.Playing,
	});

client.on("ready", () => {
	console.log("Ready!");
	if (client.user) setActivity(client.user);
	setInterval(() => {
		if (client.user) setActivity(client.user);
	}, 3600 * 1000);
});

const creator = new SlashCreator({
	applicationID: process.env.DISCORD_CLIENT_ID!,
	token: process.env.DISCORD_BOT_TOKEN!,
	client,
});

creator.on("warn", (message) => console.warn(message));
creator.on("error", (error) => console.error(error));
creator.on("synced", () => console.info("Commands synced!"));
creator.on("commandRun", (command, _, ctx) => {
	updateUser(ctx.user);
	console.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`);
});
creator.on("commandRegister", (command) => console.info(`Registered command ${command.commandName}`));
creator.on("commandError", (command, error) => console.error(`Command ${command.commandName}:`, error));

creator
	.withServer(new GatewayServer((handler) => client.ws.on(GatewayDispatchEvents.InteractionCreate, handler)))
	.registerCommandsIn(path.join(__dirname, "commands"))
	.syncCommands();

client.login(process.env.DISCORD_BOT_TOKEN);
