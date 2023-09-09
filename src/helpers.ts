import Discord from "discord.js-selfbot-v13";
import axios, {AxiosError} from "axios";
import {Volunteer} from "./types/volunteer";
import config from "./config.json";
import {Capcode} from "./types/capcode";
import {ConsoleType} from "./types/consoleType";
import {ExternalPage} from "./types/externalPage";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const setActivity = (client: Discord.Client) => {
	client.user?.setActivity(new Discord.RichPresence()
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
};

const consoleMessage = (message: string, type: ConsoleType = ConsoleType.Log) => {
	message = `${new Date().toLocaleString("en-AU")} // ${message}`;

	switch (type) {
		case ConsoleType.Log:
			console.log(message);
			break;

		case ConsoleType.Info:
			console.info(message);
			break;

		case ConsoleType.Warn:
			console.warn(message);
			break;

		case ConsoleType.Error:
			console.error(message);
			break;

	}
};

const toTitleCase = (string: string) => string.replace(
	/\w\S*/g,
	(txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
);

const getCapcodeDetails = (capcode: string): Capcode => config.capcodes[config.capcodes.findIndex(i => i.id === capcode)];

const checkLatestPageForVolunteer = async (volunteer: Volunteer): Promise<ExternalPage | null> => {
	const capcode = getCapcodeDetails(volunteer.capcode);

	return await axios.post(process.env.INTERPRETER_ENDPOINT, {
		token: process.env.INTERPRETER_TOKEN,
		station: capcode.code,
		district: capcode.district
	}, {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		}
	})
		.then((response) => {
			response.data["capcode"] = volunteer.capcode;

			return response.data as ExternalPage;
		})
		.catch((error: AxiosError) => {
			consoleMessage(`There was an error with ${error.config?.url}.`, ConsoleType.Error);
			console.log(error);
			return null;
		});
};

export {sleep, setActivity, consoleMessage, toTitleCase, checkLatestPageForVolunteer};