import Discord, {Client, DMChannel, TextChannel} from "discord.js-selfbot-v13";
import * as dotenv from "dotenv";
import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	VoiceConnectionStatus
} from "@discordjs/voice";

dotenv.config({ path: process.cwd() + "/.env" });

const client = new Client({
	checkUpdate: false,
	syncStatus: false,
	patchVoice: true
});

const main = async () => {
	if (!client.user) return;

	client.user.setActivity(new Discord.RichPresence()
		.setApplicationId(process.env.APPLICATION_ID)
		.setType("LISTENING")
		.setName("FIRECOM")
		.setDetails("Monitoring Pages")
		.setState("Monitoring Frankston & Scoresby")
		.setAssetsLargeText("Capcodes")
		.setParty({
			max: 2,
			current: 2,
		})
		.setAssetsLargeImage("https://cdn.discordapp.com/attachments/388997321821650954/1145014035788615700/595670.png")
		.setAssetsSmallImage("https://cdn.discordapp.com/attachments/388997321821650954/1145014290143784980/800px-Country_Fire_Authority_Australia_logo.png")
		.setAssetsSmallText("CFA")
		.addButton("Frankston Pages", "https://mazzanet.net.au/cfa/?filter=FTON&reg=08&magickey=pagerstream")
		.addButton("Scoresby Pages", "https://mazzanet.net.au/cfa/?filter=SCOR&reg=13&magickey=pagerstream"));

	client.channels.fetch(process.env.CHANNEL_ID).then(anyChannel => {
		const channel = anyChannel as TextChannel;

		console.log(channel.name);
	});

	// await axios.get("https://audio.broadcastify.com/18994.mp3", {
	// 	auth: {
	// 		username: process.env.BROADCASTIFY_USERNAME,
	// 		password: process.env.BROADCASTIFY_PASSWORD
	// 	}
	// })
	// 	.then(res => {
	// 		console.log("Success!");
	// 	})
	// 	.catch((error: AxiosError) => {
	// 		console.error(`There was an error with ${error.config?.url}.`);
	// 		console.error(error.toJSON());
	// 		return [];
	// 	});

	const player = createAudioPlayer();
	const connection = await (client.channels.cache.get("1144993661747200103") as DMChannel).call();

	connection.subscribe(player);

	const resource = createAudioResource(process.env.BROADCASTIFY_URL, {
		inputType: StreamType.Arbitrary
	});

	player.play(resource);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

client.on("ready", async () => main());

client.login(process.env.TOKEN).finally();