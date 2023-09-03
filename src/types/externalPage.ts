import {Nature} from "./nature";

interface ExternalPage {
	message: string;
	nature: Nature;
	timestamp: string;
	localTimestamp: string;
	capcode: string;
	mapUrl: string
}

export {ExternalPage};