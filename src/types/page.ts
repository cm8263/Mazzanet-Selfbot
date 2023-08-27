import {createAudioPlayer, createAudioResource, StreamType} from "@discordjs/voice";
import Discord, {DMChannel} from "discord.js-selfbot-v13";
import {sleep} from "../helpers";

const replacements: {[key: string]: string}  = {
	"P10": "Pumper 10",
	"P87A": "Pumper 87A",
	"P87B": "Pumper 87B",
	"P88": "Pumper 88",
	"P89": "Pumper 89",
	"P90": "Pumper 90",
	"P91A": "Pumper 91A",
	"P91B": "Pumper 91B",
	"P92": "Pumper 92",
	"P93": "Pumper 93",
	"P94": "Pumper 94",
	"P95": "Pumper 95",

	"LP87": "Ladder Platform 87",
	"R87": "Rescue 87",
	"TR87": "Technical Rescue 87",
	"PODHAR": "High Angle Rescue POD",
	"T10A": "Transporter 10A",
	"T10B": "Transporter 10B",

	"LANWR": "Langwarrin Rescue",
	"FTONSV": "Frankston Salvage",

	"CFTON": "Frankston CFA",
	"CBAXT": "Baxter CFA",
	"CSCOR": "Scorsby CFA",
	"CMORN": "Mornington CFA",
	"CLANW": "Langwarrin CFA",
	"CMTEL": "Mount Eliza CFA",
	"CSKYE": "Skye CFA",
	"FRAN1": "Frankston SES",

	"RESCC1": "Rescue Code 1",
	"STRUC1": "Structure Fire Code 1",
	"ALARC1": "Fire Indicator Panel Code 1",
	"G&SSC1": "Grass & Scrub Fire Code 1",
	"NOSTC1": "Non-structure Fire Code 1",
	"HAZMC1": "HAZMAT Incident Code 1",
	"HIARC1": "High-angle Rescue Code 1",
	"INCIC1": "Incident Code 1",

	"RESCC3": "Rescue Code 3",
	"STRUC3": "Structure Fire Code 3",
	"ALARC3": "Fire Indicator Panel Code 3",
	"G&SSC3": "Grass & Scrub Fire Code 3",
	"NOSTC3": "Non-structure Fire Code 3",
	"HAZMC3": "HAZMAT Incident Code 3",
	"HIARC3": "High-angle Rescue Code 3",
	"INCIC3": "Incident Code 3",

	" F ": " Fire ",
	" AF ": " Ambulance, Fire ",
	" AFP ": " Ambulance, Fire, Police ",
	" AFPR ": " Ambulance, Fire, Police, Rescue ",

	" YO ": " year old ",
	" ST ": " Street ",
	" AV ": " Avenue ",
	" CR ": " Crescent ",
	" CT ": " Court ",
	" PL ": " Place ",

	" /": " / ",
}

class Page {
	private readonly client: Discord.Client;
	private readonly content: string;

	constructor(client: Discord.Client, message: string) {
		this.client = client;

		for (const key in replacements) {
			if (message.includes(key)) {
				message = message.replaceAll(key, `${replacements[key]}, `);
			}
		}

		this.content = message;
	}

	public broadcast = async () => {
		const player = createAudioPlayer();
		const channel = await this.client.channels.fetch(process.env.CHANNEL_ID) as DMChannel;
		const connection = await channel.call();

		connection.subscribe(player);

		console.log(this.content);

		const url = `https://api.voicerss.org/?key=${process.env.VOICERSS_API_KEY}&c=MP3&hl=en-us&f=12khz_8bit_stereo&v=Mary&r=-1&src=${this.content}`

		const resource = createAudioResource(url, {
			inputType: StreamType.Arbitrary
		});

		let timeout = 30;

		while (--timeout > 0 && channel.voiceUsers.size === 1) {
			await sleep(1000);
		}

		if (timeout === 0) {
			connection.destroy();
			return;
		}

		await sleep(2000);

		player.play(resource);

		player.addListener("stateChange", (_, newOne) => {
			if (newOne.status == "idle") connection.destroy();
		});
	}
}

export {Page};