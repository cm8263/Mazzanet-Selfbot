import {Client} from "discord.js-selfbot-v13";
import * as dotenv from "dotenv";
import {setActivity} from "./helpers";
import {HttpServer} from "./types/httpServer";

dotenv.config({ path: process.cwd() + "/.env" });

const client = new Client({
	checkUpdate: false,
	syncStatus: false,
	patchVoice: true
});

const main = async () => {
	if (!client.user) return;

	setActivity(client);
}

client.on("ready", async () => await main());

client.login(process.env.TOKEN).finally();

new HttpServer(client);