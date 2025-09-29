export const ConnectionTypes = {
	GroupSelection: 'GroupSelection',
	CustomApplicationServer: 'CustomApplicationServer',
} as const;

export const SecurityLevel = {
	Highest: 'Highest',
	Encrypted: 'Encrypted',
	Signed: 'Signed',
	Authed: 'Authed',
} as const;

export type ConnectionType = keyof typeof ConnectionTypes;

type CommonProperties = {
	name: string;
	displayName?: string;
	description?: string;
	systemId: string;
	sncEnabled: boolean;
	ssoEnabled: boolean;
	sncName: string;
	sncLevel: keyof typeof SecurityLevel;
	sapRouterString?: string;
	keepSynced: boolean;
	wasPredefined: boolean;
};

type GroupSelectionProperties = {
	connectionType: typeof ConnectionTypes.GroupSelection;
	messageServer: string;
	group: string;
	messageServerPort?: number;
};

type ApplicationServerProperties = {
	connectionType: typeof ConnectionTypes.CustomApplicationServer;
	applicationServer: string;
	instanceNumber: string;
	rfcGatewayServer?: string;
	rfcGatewayServerPort?: number;
};

export type Connection =
	| (CommonProperties & GroupSelectionProperties)
	| (CommonProperties & ApplicationServerProperties);

export function isGroupSelection(
	connection: Connection,
): connection is Connection & GroupSelectionProperties {
	return connection.connectionType === ConnectionTypes.GroupSelection;
}

export function isApplicationServer(
	connection: Connection,
): connection is Connection & ApplicationServerProperties {
	return connection.connectionType === ConnectionTypes.CustomApplicationServer;
}
