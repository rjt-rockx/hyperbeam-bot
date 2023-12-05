<script lang="ts">
	export let message: any;
	export let author: any;
</script>

<discord-message
	author={author.globalName || author.username}
	avatar={author.displayAvatarURL || author.avatarURL}
	edited={!!message.editedTimestamp}
	roleColor={author.hexAccentColor}>
	{message.cleanContent}
</discord-message>
