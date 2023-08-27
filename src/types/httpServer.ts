import http, {IncomingMessage, Server, ServerResponse} from "http";
import {URL} from "url";
import {Page} from "./page";
import Discord from "discord.js-selfbot-v13";

class HttpServer {
	private readonly server: Server;
	private readonly client: Discord.Client;

	constructor(client: Discord.Client) {
		this.server = http.createServer();
		this.server.on("request", this.handler.bind(this.handler));
		this.server.listen(6969);

		this.client = client;
	}

	private handler = async (request: IncomingMessage, response: ServerResponse) => {
		const url = new URL(request.url as string, process.env.BASE_URL);
		const token = url.searchParams.get("t");

		if (token === null) {
			this.badRequest(response);
			return;
		}

		if (token !== process.env.HTTP_TOKEN) {
			response.writeHead(401, {
				"Content-Type": "text/html"
			});
			response.write("<img src=\"https://http.cat/images/401.jpg\" alt=\"401 Unauthorized\">");
			response.end();
			return;
		}

		switch (url.pathname) {
			case "/newPage":
				const message = url.searchParams.get("p");

				if (message === null) {
					this.badRequest(response);
					return;
				}

				response.writeHead(204);
				response.end();

				const page = new Page(this.client, message);

				await page.broadcast();

				break;

			default:
				this.badRequest(response);
				break;
		}
	}

	private badRequest = (response: ServerResponse) => {
		response.writeHead(400, {
			"Content-Type": "text/html"
		});
		response.write("<img src=\"https://http.cat/images/400.jpg\" alt=\"400 Bad Request\">");
		response.end();
	}
}

export {HttpServer};