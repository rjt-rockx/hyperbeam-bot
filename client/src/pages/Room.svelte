<script lang="ts">
	import { getNotificationsContext } from "svelte-notifications";
	import Cursor from "../components/Cursor.svelte";
	import ErrorPage from "../components/ErrorPage.svelte";
	import Hyperbeam from "../components/Hyperbeam.svelte";
	import Loading from "../components/Loading.svelte";
	import Toolbar from "../components/Toolbar.svelte";
	import { connect } from "../scripts/api";
	import { currentUser, members, room } from "../store";
	import Chat from "../components/Chat.svelte";

	const { addNotification } = getNotificationsContext();

	export let roomUrl: string;

	async function loadRoom() {
		try {
			await connect(roomUrl);
		} catch (e) {
			console.log("Failed to join room", e);
			localStorage.removeItem("token");
			await connect(roomUrl);
		}
	}

	let vmNode: HTMLDivElement;

	/** Check if authentification was successful after clicking sign in button */
	function wasAuthSuccessful() {
		return !(localStorage.getItem("redirectAfterAuth") === `/${roomUrl}`);
	}

	$: if (!wasAuthSuccessful()) {
		addNotification({
			text: "Failed to sign in to Discord. Please try again.",
			type: "error",
			position: "top-right",
		});
		localStorage.removeItem("redirectAfterAuth");
	}

	$: isFullscreen = false;

	window.addEventListener("fullscreenchange", () => {
		isFullscreen = document.fullscreenElement !== null;
	});

	// $: loggedIn = $currentUser && $currentUser.isAuthenticated;

	let showLoading = true;

	let orientation: "horizontal" | "vertical" = "horizontal";
	handleResize();

	function handleResize() {
		orientation = window.innerWidth <= window.innerHeight ? "vertical" : "horizontal";
	}
</script>

<svelte:window on:resize={handleResize} />
{#await loadRoom()}
	<Loading bind:showLoading />
{:then}
	{#if $room && $room.state.embedUrl}
		<div class="layout" class:vertical={orientation === "vertical"}>
			<div class="split">
				<div class="room" style:--isFullscreen={isFullscreen ? 1 : 0} class:isFullscreen>
					<Hyperbeam embedUrl={$room.state.embedUrl} bind:vmNode />
					{#if vmNode}
						{#each $members as member}
							{#if member.cursor && $currentUser && member.id !== $currentUser.id}
								<Cursor left={member.cursor.x} top={member.cursor.y} {vmNode} text={member.name} color={member.color} />
							{/if}
						{/each}
					{/if}
				</div>
				{#if orientation === "horizontal"}
					<div class="sidepanel">
						<Chat />
					</div>
				{/if}
			</div>
			<Toolbar />
			{#if orientation === "vertical"}
				<div class="bottompanel">
					<Chat />
				</div>
			{/if}
		</div>
	{:else}
		<ErrorPage />
	{/if}
{/await}

<style lang="scss">
	.layout {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	.split {
		flex-grow: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
	}

	.room {
		aspect-ratio: 16 / 9;
		height: 100%;
		width: auto;
		max-width: calc(100% - min(30%, 384px));
		position: relative;
	}

	.vertical {
		.split {
			height: fit-content;
			flex-grow: 0;
		}

		.room {
			width: 100%;
			height: auto;
			max-width: 100%;
		}
	}

	.sidepanel {
		display: flex;
		flex-grow: 1;
		min-width: 300px;
		height: 100%;
	}

	.bottompanel {
		flex-grow: 1;
	}

	:global(body):has(.isFullscreen) {
		overflow: hidden;
	}

	:global(.hyperbeam) {
		position: absolute;
		inset: 0;
	}

	:global(.toolbar) {
		width: 100%;
	}

	@media (max-width: 767px) {
		:global(.hyperbeam) {
			position: absolute;
			inset: 0;
		}
	}
</style>
