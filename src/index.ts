import {Client, VoiceBasedChannel} from "discord.js-selfbot-v13";
import * as dotenv from "dotenv";
import {checkLatestPageForVolunteer, consoleMessage, setActivity} from "./helpers";
import {HttpServer} from "./types/httpServer";
import config from "./config.json";
import {Volunteer} from "./types/volunteer";
import OpenAI from "openai";
import {Page} from "./types/page";
import {ConsoleType} from "./types/consoleType";

dotenv.config({ path: process.cwd() + "/.env" });

const volunteers: Volunteer[] = config.volunteers;
const volunteerPositions: {[key: string]: VoiceBasedChannel} = {};
const openai = new OpenAI();

const client = new Client({
	checkUpdate: false,
	syncStatus: false,
	patchVoice: true
});

const main = async () => {
	if (!client.user) return;

	consoleMessage("Self-Bot online!", ConsoleType.Info);

	setActivity(client);

	setInterval(() => setActivity(client), 60 * 60 * 1000);
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
		if (Object.prototype.hasOwnProperty.call(volunteerPositions, volunteer.id)) delete volunteerPositions[volunteer.id];

		const latestPage = await checkLatestPageForVolunteer(volunteer);

		if (!latestPage) return;

		const date = new Date(latestPage.timestamp);
		const minutesSinceCall = Math.floor((Math.abs(date.getTime() - new Date().getTime()) / 1000) / 60);

		if (minutesSinceCall > 3) return;

		consoleMessage(`Volunteer ${volunteer.name} just disconnected from ${oldChannel}, and we detected a new call. Creating page!`, ConsoleType.Info);
		consoleMessage(`Page Message >> ${latestPage.message}`);

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