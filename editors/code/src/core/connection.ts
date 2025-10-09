/**
 * Typedefinitions and type related utility functions related to the system connection api.
 *
 * @important No imports that lead to external dependencies, otherwise the webview cant import.
 */

/**
 * The possible protocols to drive communication with the sap backend.
 *
 * `HTTP` is also representative of `HTTPS`.
 */
export const ConnectionProtocol = {
	Rfc: 'rfc',
	Http: 'http',
} as const;

/**
 * The possible RFC connection types to connect with.
 */
export const ConnectionType = {
	GroupSelection: 'group_selection',
	CustomApplicationServer: 'custom_application_server',
} as const;

/**
 * The possible SNC Connection security levels
 */
export const SecurityLevel = {
	Highest: 'highest',
	Encrypted: 'encrypted',
	Signed: 'signed',
	Authed: 'authed',
} as const;

/**
 * The current state of a {@link SystemConnection}.
 */
export const ConnectionState = {
	disconnected: 'disconnected',
	connected: 'connected',
} as const;

export type ConnectionType =
	(typeof ConnectionType)[keyof typeof ConnectionType];

export type ConnectionProtocol =
	(typeof ConnectionProtocol)[keyof typeof ConnectionProtocol];

export type SecurityLevel = (typeof SecurityLevel)[keyof typeof SecurityLevel];

export type ConnectionState =
	(typeof ConnectionState)[keyof typeof ConnectionState];

type RfcBaseParams = {
	protocol: typeof ConnectionProtocol.Rfc;
	connectionType: ConnectionType;
	sncEnabled: boolean;
	ssoEnabled: boolean;
	sncName: string;
	sncLevel: SecurityLevel;
	sapRouterString?: string;
};

/**
 * Connection Properties for a RFC connection using group selection.
 */
type RfcGroupSelectionParams = {
	messageServer: string;
	group: string;
	messageServerPort?: number;
};

/**
 * Connection Properties for a RFC connection to a Custom Application Server.
 */
type RfcApplicationServerParams = {
	applicationServer: string;
	instanceNumber: string;
	rfcGatewayServer?: string;
	rfcGatewayServerPort?: number;
};

/**
 * Union Type for RFC connections Parameters to establish a connection.
 *
 * You can use {@link isApplicationServer} and {@link isGroupSelection} to narrow the type.
 */
export type RfcConnectionParams = RfcBaseParams &
	(RfcGroupSelectionParams | RfcApplicationServerParams);

/**
 * Connection properties for a HTTP(S) connection.
 */
export type HttpConnectionParams = {
	protocol: typeof ConnectionProtocol.Http;

	/**
	 * The hostname of the server to connect to (e.g., 'example.com').
	 * Must not include the protocol (e.g., 'https://').
	 * @example '127.0.0.1'
	 */
	hostname: string;

	/**
	 * The port number to connect to the server on.
	 * Common ports include 80 for HTTP and 443 for HTTPS.
	 * @example 50001
	 */
	port: number;

	/**
	 * Specifies whether the connection should use SSL/TLS encryption for security.
	 * Set to `true` for HTTPS connections, `false` for HTTP.
	 * @default true
	 */
	ssl: boolean;

	/**
	 * Path to a custom certificate file (.pem) used to verify the server's identity.
	 * Leave undefined if using default system certificates.
	 * @example './certs/server-cert.pem'
	 */
	customCertificate?: string;

	/**
	 * Whether to tolerate a hostname mismatch in the server's certificate.
	 * Enable this only in controlled environments, as it reduces security.
	 * @default false
	 */
	acceptInvalidHostname: boolean;

	/**
	 * Whether to trust the server's certificate regardless of its validity.
	 * Use with extreme caution, as this bypasses critical security checks.
	 * Only enable in testing or when absolutely necessary.
	 * @default false
	 */
	acceptInvalidCerts: boolean;
};

// Union type for Connection
export type ConnectionParams = {
	client: string;
	language: string;
} & (HttpConnectionParams | RfcConnectionParams);

/**
 * A System that has been saved by the user to connect to.
 *
 * Wraps the data required to identity and connect to the underlying system as well
 * as user defined properties such as how the system should be displayed and kept
 * in sync with a landscape provider if existent.
 */
export type SystemConnection = {
	/** The name of the system connection in the system explorer, unique! */
	name: string;

	/** SID of the SAP System to connect to */
	systemId: string;

	/** Defines how the system will be connected to, see {@link ConnectionParams} */
	params: ConnectionParams;

	/** The description of the system in the system explorer. */
	description: string;

	/** State of the connection, only available in non configurative contexts. */
	state?: ConnectionState;

	/** The URL of the landscape provider that defines this system if applicable. */
	landscapeProviderUrl?: string;
};

/**
 * A system definition with its origin from a landscape provider.
 */
export type LandscapeSystem = {
	params: ConnectionParams;

	systemId: string;

	name: string;

	description: string;
};

export type ConnectionTestResult = {
	success: boolean;
	message: string;
};

export function isRfcConnection(
	parameters: ConnectionParams,
): parameters is ConnectionParams & RfcConnectionParams {
	return parameters.protocol === ConnectionProtocol.Rfc;
}

export function isHttpConnection(
	parameters: ConnectionParams,
): parameters is ConnectionParams & HttpConnectionParams {
	return parameters.protocol === ConnectionProtocol.Http;
}

export function isGroupSelection(
	params: RfcConnectionParams,
): params is RfcBaseParams & RfcGroupSelectionParams {
	return params.connectionType === ConnectionType.GroupSelection;
}

export function isApplicationServer(
	params: RfcConnectionParams,
): params is RfcBaseParams & RfcApplicationServerParams {
	return params.connectionType === ConnectionType.CustomApplicationServer;
}

export const DEFAULT_HTTP_SYSTEM: SystemConnection = {
	systemId: '',
	name: '',
	description: '',
	params: {
		protocol: ConnectionProtocol.Http,
		client: '001',
		language: 'en',
		port: 50001,
		hostname: '127.0.0.1',
		ssl: true,
		acceptInvalidCerts: false,
		acceptInvalidHostname: false,
	},
};

export const DEFAULT_RFC_SYSTEM: SystemConnection = {
	systemId: '',
	name: '',
	description: '',
	params: {
		protocol: ConnectionProtocol.Rfc,
		client: '001',
		language: 'en',
		applicationServer: '',
		connectionType: ConnectionType.CustomApplicationServer,
		instanceNumber: '00',
		sncEnabled: true,
		ssoEnabled: true,
		sncLevel: SecurityLevel.Highest,
		sncName: '',
	},
};
