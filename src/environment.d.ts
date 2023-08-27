declare global {
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string;
			CHANNEL_ID: string;
			APPLICATION_ID: string;
			BROADCASTIFY_URL: string;
			BROADCASTIFY_USERNAME: string;
			BROADCASTIFY_PASSWORD: string;
			VOICERSS_API_KEY: string;
			HTTP_TOKEN: string;
			BASE_URL: string;
		}
	}
}

export {};