import {Client, DMChannel, PartialGroupDMChannel, VoiceBasedChannel, VoiceChannel} from "discord.js-selfbot-v13";
import * as dotenv from "dotenv";
import {checkLatestPageForVolunteer, setActivity} from "./helpers";
import {HttpServer} from "./types/httpServer";
import config from "./config.json";
import {Volunteer} from "./types/volunteer";
import OpenAI from "openai";
import {Page} from "./types/page";

dotenv.config({ path: process.cwd() + "/.env" });

const volunteers: Volunteer[] = config.volunteers;
const volunteerPositions: {[key: string]: VoiceBasedChannel} = {};
const openai = new OpenAI();

const client = new Client({
	checkUpdate: false,
	syncStatus: false,
	patchVoice: true
});

const voiceChannels: (VoiceChannel | DMChannel | PartialGroupDMChannel)[] = [];

const main = async () => {
	if (!client.user) return;

	setActivity(client);
};

client.on("ready", async () => await main());

client.on("voiceStateUpdate", async (oldState, newState) => {
	const userId = oldState.id;
	const volunteerIndex = volunteers.findIndex(i => i.id === userId);

	// Not a volunteer
	if (volunteerIndex === -1) return;

	const volunteer = volunteers[volunteerIndex];
	const oldChannel = oldState.channel;
	const newChannel = newState.channel;

	if (!oldChannel && newChannel) {
		volunteerPositions[volunteer.id] = newChannel;
	} else if (oldChannel && !newChannel) {
		if (volunteerPositions.hasOwnProperty(volunteer.id)) delete volunteerPositions[volunteer.id];

		const latestPage = await checkLatestPageForVolunteer(volunteer);

		if (!latestPage) return;

		const date = new Date(latestPage.timestamp);
		const minutesSinceCall = Math.floor((Math.abs(date.getTime() - new Date().getTime()) / 1000) / 60);

		if (minutesSinceCall > 3) return;

		const page = new Page(
			client,
			openai,
			latestPage.nature,
			latestPage.capcode,
			date,
			latestPage.localTimestamp,
			latestPage.message,
			latestPage.mapUrl
		);

		await page.generateSummaries();
		await page.publish();
		await page.broadcast(volunteer, oldChannel);
	}
});

client.login(process.env.TOKEN).finally();

new HttpServer(client, openai);