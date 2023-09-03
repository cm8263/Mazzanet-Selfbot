import http, {IncomingMessage, Server, ServerResponse} from "http";
import {URL} from "url";
import {Page} from "./page";
import Discord from "discord.js-selfbot-v13";
import {parse} from "querystring";
import {Nature} from "./nature";
import OpenAI from "openai";

class HttpServer {
	private readonly server: Server;
	private readonly client: Discord.Client;
	private readonly openai: OpenAI;

	constructor(client: Discord.Client, openai: OpenAI) {
		this.server = http.createServer();
		this.server.on("request", this.handler.bind(this.handler));
		this.server.listen(process.env.HTTP_SERVER_PORT);

		this.client = client;
		this.openai = openai;
	}

	private handler = async (request: IncomingMessage, response: ServerResponse) => {
		if (request.method !== "POST") {
			response.writeHead(405, {
				"Content-Type": "text/html",
				"Allow": "POST"
			});
			response.end("<img src=\"https://http.cat/images/405.jpg\" alt=\"405 Method Not Allowed\">");
			return;
		}

		const url = new URL(request.url as string, process.env.BASE_URL);

		let body = "";

		request.on("data", chunk => {
			body += chunk.toString();
		});

		request.on("end", async () => {
			const data = parse(body);
			const token = data["token"] as string | undefined;

			if (token === undefined) {
				this.badRequest(response);
				return;
			}

			if (token !== process.env.HTTP_TOKEN) {
				response.writeHead(401, {
					"Content-Type": "text/html"
				});
				response.end("<img src=\"https://http.cat/images/401.jpg\" alt=\"401 Unauthorized\">");
				return;
			}

			switch (url.pathname) {
			case "/newPage":
				const message = data["message"] as string | undefined;

				if (message === undefined) {
					this.badRequest(response);
					return;
				}

				response.writeHead(204);
				response.end();

				const page = new Page(
					this.client,
					this.openai,
					(data["nature"] as unknown) as Nature,
					data["capcode"] as string,
					(data["timestamp"] as unknown) as Date,
					data["localTimestamp"] as string,
					data["message"] as string
				);

				//await page.broadcast();
				await page.publish();

				break;

			default:
				this.badRequest(response);
				break;
			}
		});
	};

	private badRequest = (response: ServerResponse) => {
		response.writeHead(400, {
			"Content-Type": "text/html"
		});
		response.end("<img src=\"https://http.cat/images/400.jpg\" alt=\"400 Bad Request\">");
	};
}

export {HttpServer};