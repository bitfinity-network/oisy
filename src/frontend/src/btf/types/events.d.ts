declare global {
	interface WindowEventMap {
		btfBridgeStart: CustomEvent<{ targetAddress: string }>;
	}
}

export {}; 