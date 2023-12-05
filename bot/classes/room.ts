import { Session } from "@prisma/client";
import { Client, Room } from "colyseus";
import { customAlphabet } from "nanoid";

import Member from "../schemas/member";
import { RoomState } from "../schemas/room";
import { HyperbeamSession } from "./hyperbeam";
import {
	authenticateUser,
	connectHbUser,
	disposeSession,
	joinSession,
	leaveSession,
	setControl,
	setCursor,
	startSession,
	StartSessionOptions,
} from "./sessions";

const nanoid = customAlphabet("6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz", 8);

export type AuthenticatedClient = Omit<Client, "auth" | "userData"> & {
	auth: Awaited<ReturnType<BotRoom["onAuth"]>>;
	userData: Member;
};

export type AuthOptions = {
	token?: string;
	deviceId?: string;
};

export class BotRoom extends Room<RoomState> {
	session?: Session & { instance: HyperbeamSession };
	guests: number[] = [];
	autoDispose = false;
	multiplayer = true;
	maxClients = 50;

	async onCreate(options: StartSessionOptions) {
		this.roomId = options.url || nanoid();
		this.setState(new RoomState());
		this.setPatchRate(40);
		this.setPrivate(true);
		this.state.ownerId = options.ownerId;
		this.state.password = options.password;
		this.state.isPasswordProtected = !!options.password;
		await this.registerMessageHandlers();
		await startSession({ room: this, options });
	}

	async onAuth(client: Client, options?: AuthOptions) {
		return authenticateUser({
			room: this,
			client,
			token: options?.token,
			deviceId: options?.deviceId,
		});
	}

	async onJoin(client) {
		await joinSession({ room: this, client: client as AuthenticatedClient });
	}

	async onLeave(client) {
		await leaveSession({ room: this, client: client as AuthenticatedClient });
	}

	async onDispose() {
		await disposeSession({ room: this });
	}

	async registerMessageHandlers() {
		this.onMessage<{ type: "setCursor"; x: number; y: number }>("setCursor", async (client, message) => {
			setCursor({ room: this, client: client as AuthenticatedClient, x: message.x, y: message.y });
		});
		this.onMessage<{ type: "setControl"; targetId: string; control: Member["control"] }>(
			"setControl",
			async (client, message) => {
				setControl({
					room: this,
					client: client as AuthenticatedClient,
					targetId: message.targetId,
					control: message.control,
				});
			},
		);
		this.onMessage<{ type: "connectHbUser"; hbId: string }>("connectHbUser", async (client, message) => {
			connectHbUser({ room: this, client: client as AuthenticatedClient, hbId: message.hbId });
		});
		this.onMessage<{ type: "authenticateMemberPassword"; password: string }>(
			"authenticateMemberPassword",
			async (client, message) => {
				if (message.password === this.state.password) {
					const target = this.state.members.get((client as AuthenticatedClient).userData.id);
					if (target) {
						await this.session?.instance?.setPermissions(target.hbId!, { control_disabled: false });
						target.control = "enabled";
						target.isPasswordAuthenticated = true;
					}
				}
			},
		);
	}
}
