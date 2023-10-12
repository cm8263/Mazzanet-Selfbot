import {createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType, VoiceConnection} from "@discordjs/voice";
import Discord, {
	BaseGuildVoiceChannel,
	DMChannel,
	PartialGroupDMChannel,
	TextChannel,
	VoiceBasedChannel
} from "discord.js-selfbot-v13";
import {consoleMessage, toTitleCase} from "../helpers";
import {Nature} from "./nature";
import config from "../config.json";
import {Capcode} from "./capcode";
import OpenAI from "openai";
import {Volunteer} from "./volunteer";
import {ConsoleType} from "./consoleType";
import {CustomVoiceTypes} from "./customVoiceTypes";
import {SummaryObject} from "./summaryObject";

const capcodes: Capcode[] = config.capcodes;
const replacements: {[key: string]: string}  = {
	"P10": "Pumper 10,",
	"P34": "Pumper 34,",
	"P85": "Pumper 85,",
	"P86": "Pumper 86,",
	"P87A": "Pumper 87A,",
	"P87B": "Pumper 87B,",
	"P88": "Pumper 88,",
	"P89": "Pumper 89,",
	"P90": "Pumper 90,",
	"P91A": "Pumper 91A,",
	"P91B": "Pumper 91B,",
	"P92": "Pumper 92,",
	"P93": "Pumper 93,",
	"P94": "Pumper 94,",
	"P95": "Pumper 95,",

	"PT28": "Pumper Tanker 28",
	"PT31": "Pumper Tanker 31",
	"LP87": "Ladder Platform 87,",
	"R87": "Rescue 87,",
	"TR87": "Technical Rescue 87,",
	"PODHAR": "High Angle Rescue Pod,",
	"T10A": "Transporter 10A,",
	"T10B": "Transporter 10B,",

	"LANWR": "Langwarrin Rescue,",
	"FTONSV": "Frankston Salvage,",
	"SCORHL": "Scorsby Hose Layer,",
	"SCORP1": "Scorsby Pumper,",
	"SCORT1": "Scorsby Tanker,",

	"CFTON": "Frankston CFA,",
	"CBAXT": "Baxter CFA,",
	"CSCOR": "Scorsby CFA,",
	"CMORN": "Mornington CFA,",
	"CLANW": "Langwarrin CFA,",
	"CMTEL": "Mount Eliza CFA,",
	"CSKYE": "Skye CFA,",
	"CROWV": "Rowville CFA,",
	"FRAN1": "Frankston SES,",
	"KNOX1": "Knox SES,",

	" [FTON]": "",
	" [SCOR]": "",

	"RESCC1": "Rescue **Code 1**,",
	"STRUC1": "Structure Fire **Code 1**,",
	"ALARC1": "Fire Indicator Panel **Code 1**,",
	"G&SSC1": "Grass & Scrub Fire **Code 1**,",
	"NOSTC1": "Non-Structure Fire **Code 1**,",
	"HAZMC1": "HAZMAT Incident **Code 1**,",
	"HIARC1": "High-angle Rescue **Code 1**,",
	"INCIC1": "Incident **Code 1**,",

	"RESCC3": "Rescue Code 3,",
	"STRUC3": "Structure Fire Code 3,",
	"ALARC3": "Fire Indicator Panel Code 3,",
	"G&SSC3": "Grass & Scrub Fire Code 3,",
	"NOSTC3": "Non-Structure Fire Code 3,",
	"HAZMC3": "HAZMAT Incident Code 3,",
	"HIARC3": "High-angle Rescue Code 3,",
	"INCIC3": "Incident Code 3,",

	" F ": ", Fire, ",
	" AF ": ", Ambulance, Fire, ",
	" AFP ": ", Ambulance, Fire, Police, ",
	" AFPR ": ", Ambulance, Fire, Police, Rescue, ",

	" YO ": " year old ",
	" ST ": " Street ",
	" AV ": " Avenue ",
	" CR ": " Crescent ",
	" CT ": " Court ",
	" PL ": " Place ",
	" DR ": " Drive ",

	" /": " / ",
	" RE:": " Regarding:"
};

class Page {
	private readonly client: Discord.Client;
	private readonly openai: OpenAI;
	private readonly nature: Nature;
	private readonly capcode: Capcode;
	private readonly timestamp: Date;
	private readonly localTimestamp: string;
	private readonly message: string;
	private readonly mapUrl: string | null;

	private summary: string | null = null;
	private summaryObject: SummaryObject | null = null;

	constructor(client: Discord.Client, openai: OpenAI, nature: Nature, capcode: string, timestamp: Date, localTimestamp: string, message: string, mapUrl: string | null = null) {
		this.client = client;
		this.openai = openai;
		this.nature = nature;
		this.capcode = capcodes[capcodes.findIndex(i => i.id === capcode)];
		this.timestamp = timestamp;
		this.localTimestamp = localTimestamp;
		this.mapUrl = mapUrl;

		message = toTitleCase(message);

		for (const key in replacements) {
			const searchTerm = toTitleCase(key);
			if (message.includes(searchTerm)) message = message.replaceAll(searchTerm, replacements[key]);
		}

		this.message = message;
	}

	public generateSummaries = async () => {
		try {
			const summary = await this.openai.chat.completions.create({
				messages: [
					{ role: "system", content: config.openAiSystem },
					{ role: "user", content: this.message }
				],
				model: "gpt-3.5-turbo",
				frequency_penalty: 0,
				presence_penalty: 0,
				temperature: 0,
				top_p: 1
			});

			this.summary = summary.choices[0].message.content;
		} catch (error) {
			consoleMessage("Error while generating summary.", ConsoleType.Warn);
			console.log(error);
		}

		try {
			const summaryObject = await this.openai.chat.completions.create({
				messages: [
					{ role: "system", content: config.openAiSystemJs },
					{ role: "user", content: this.message }
				],
				model: "gpt-3.5-turbo",
				frequency_penalty: 0,
				presence_penalty: 0,
				temperature: 0,
				top_p: 1
			});

			this.summaryObject = summaryObject.choices[0].message.content !== null ? JSON.parse(summaryObject.choices[0].message.content) : null;
		} catch (error) {
			consoleMessage("Error while generating summary object.", ConsoleType.Warn);
			console.log(error);
		}
	};

	public broadcast = async (volunteer: Volunteer, voiceChannel: VoiceBasedChannel) => {
		const player = createAudioPlayer();

		let connection: VoiceConnection;
		let channel: DMChannel | BaseGuildVoiceChannel | PartialGroupDMChannel;

		switch (voiceChannel.type as CustomVoiceTypes) {
			case "DM":
			case "GROUP_DM":
				channel = (voiceChannel as unknown) as DMChannel;

				connection = await channel.call();
				break;

			case "GUILD_VOICE":
				channel = voiceChannel as BaseGuildVoiceChannel;

				connection = joinVoiceChannel({
					channelId: channel.id,
					guildId: channel.guildId,
					adapterCreator: channel.guild.voiceAdapterCreator
				});
				break;

			default:
				return;
		}

		connection.subscribe(player);

		let message = `Excuse this interruption. Just joining to let you know that ${volunteer.name} had to go to a `;

		if (this.summaryObject === null) {
			message += "Fire Call";
		} else {
			message += this.summaryObject["Call Nature"] ?? "Fire Call";
		}

		message += ". Thanks for your understanding.";

		const url = `https://api.voicerss.org/?key=${process.env.VOICERSS_API_KEY}&c=OGG&hl=en-us&f=12khz_8bit_stereo&v=Mary&r=-1&src=${message}`;

		const resource = createAudioResource(url, {
			inputType: StreamType.Arbitrary
		});

		player.play(resource);
		player.addListener("stateChange", (_, state) => state.status == "idle" && connection.destroy());
	};

	public publish = async () => {
		const recordsChannel = await this.client.channels.fetch(config.recordsChannel) as TextChannel;

		if (!recordsChannel) return;

		const embed = new Discord.WebEmbed({ shorten: true, hidden: false})
			.setAuthor({
				name: `${this.capcode.name} CFA`,
				url: `https://mazzanet.net.au/cfa/?filter=${this.capcode.code}&reg=${this.capcode.district}&magickey=pagerstream`,
			})
			.setColor("RED")
			.setDescription(this.summary ?? this.message)
			.setTitle((this.summaryObject && this.summaryObject["Call Nature"]) ?? "Fire Call")
			.setProvider({ name: "View Details", url: `https://mazzanet.net.au/cfa/?inc=${this.message.split(" ").pop()}&magickey=pagerstream` });

		this.mapUrl !== null && embed.setImage(this.mapUrl);

		await recordsChannel.send({ embeds: [embed] });
	};
}

export {Page};