declare global {
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string;
			APPLICATION_ID: string;
			BROADCASTIFY_URL: string;
			BROADCASTIFY_USERNAME: string;
			BROADCASTIFY_PASSWORD: string;
			VOICERSS_API_KEY: string;
			HTTP_TOKEN: string;
			BASE_URL: string;
			OPENAI_API_KEY: string;
			HTTP_SERVER_PORT: string;
			INTERPRETER_ENDPOINT: string;
			INTERPRETER_TOKEN: string;
		}
	}
}

export {};