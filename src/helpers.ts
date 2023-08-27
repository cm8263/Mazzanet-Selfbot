import Discord from "discord.js-selfbot-v13";

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
}

export {sleep, setActivity};