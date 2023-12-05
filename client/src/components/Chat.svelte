<script lang="ts">
	import { onMount } from "svelte";
	import { messages } from "../store";
	import DiscordMessage from "./DiscordMessage.svelte";
	onMount(async () => {
		const { applyPolyfills, defineCustomElements } = await import("@skyra/discord-components-core/loader");
		await applyPolyfills();
		defineCustomElements();
	});
</script>

<discord-messages id="messages">
	{#each $messages as receivedMessage}
		<DiscordMessage message={receivedMessage.message} author={receivedMessage.author} />
	{/each}
</discord-messages>

<style lang="scss">
	#messages {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0 0.5rem;
		flex-direction: column;
		justify-content: end;
	}
</style>
