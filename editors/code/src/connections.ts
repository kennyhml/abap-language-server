export const ConnectionTypes = {
	GroupSelection: 'GroupSelection',
	CustomApplicationServer: 'CustomApplicationServer',
} as const;

export const ConnectionProtocols = {
	RFC: 'RFC',
	HTTP: 'HTTP',
} as const;

export const SecurityLevel = {
	Highest: 'Highest',
	Encrypted: 'Encrypted',
	Signed: 'Signed',
	Authed: 'Authed',
} as const;

export type SubmissionResult = {
	success: boolean;
	message: string;
};

export type ConnectionProtocol =
	(typeof ConnectionProtocols)[keyof typeof ConnectionProtocols];
export type ConnectionType = keyof typeof ConnectionTypes;

export const DEFAULT_HTTP_SYSTEM: System = {
	systemId: '',
	displayName: '',
	description: '',
	defaultClient: '001',
	defaultLanguage: 'en',
	connection: {
		kind: ConnectionProtocols.HTTP,
		params: {
			port: 50001,
			hostname: '127.0.0.1',
			ssl: true,
			acceptInvalidCerts: false,
			acceptInvalidHostname: false,
		},
	},
};

export const DEFAULT_RFC_SYSTEM: System = {
	systemId: '',
	displayName: '',
	description: '',
	defaultClient: '001',
	defaultLanguage: 'en',
	connection: {
		kind: ConnectionProtocols.RFC,
		params: {
			applicationServer: '',
			connectionType: ConnectionTypes.CustomApplicationServer,
			instanceNumber: '00',
			sncEnabled: true,
			ssoEnabled: true,
			sncLevel: SecurityLevel.Highest,
			sncName: '',
		},
	},
};

/**
 * Connection Properties for a RFC connection that apply regardless
 * of the underlying connection type that is used in the end.
 */
type RfcCommonProperties = {
	sncEnabled: boolean;
	ssoEnabled: boolean;
	sncName: string;
	sncLevel: keyof typeof SecurityLevel;
	sapRouterString?: string;
};

/**
 * Connection Properties for a RFC connection using group selection.
 */
type RfcGroupSelection = {
	connectionType: typeof ConnectionTypes.GroupSelection;
	messageServer: string;
	group: string;
	messageServerPort?: number;
};

/**
 * Connection Properties for a RFC connection to a Custom Application Server.
 */
type RfcCustomApplicationServer = {
	connectionType: typeof ConnectionTypes.CustomApplicationServer;
	applicationServer: string;
	instanceNumber: string;
	rfcGatewayServer?: string;
	rfcGatewayServerPort?: number;
};

/**
 * Connection properties for a HTTP(S) connection.
 */
type HttpCommonProperties = {
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

/**
 * Union Type for RFC connections Parameters to establish a connection.
 *
 * You can use {@link isApplicationServer} and {@link isGroupSelection} to narrow the type.
 */
export type RfcConnectionParams = RfcCommonProperties &
	(RfcGroupSelection | RfcCustomApplicationServer);

/**
 * Wrapper for {@link HttpCommonProperties}
 */
export type HttpConnectionParams = HttpCommonProperties;

/**
 * A union of possible connection params depending on whether the underlying
 * connection is based on RFC or HTTP(S) as well as other metadata that
 * may come along from a landscape system provider.
 *
 * You can use {@link isHttpConnection} and {@link isRfcConnection} to further narrow the type.
 */
type RfcConnection = {
	kind: typeof ConnectionProtocols.RFC;
	params: RfcConnectionParams;
};

type HttpConnection = {
	kind: typeof ConnectionProtocols.HTTP;
	params: HttpConnectionParams;
};

// Union type for Connection
export type Connection = RfcConnection | HttpConnection;

/**
 * A System that has been saved by the user to connect to.
 *
 * Wraps the data required to identity and connect to the underlying system as well
 * as user defined properties such as how the system should be displayed and kept
 * in sync with a landscape provider if existent.
 */
export type System = {
	/** Defines how the system will be connected to, see {@link Connection} */
	connection: Connection;

	systemId: string;

	/** The display name of the system in the system explorer */
	displayName: string;

	/** The description of the system in the system explorer. */
	description: string;

	/** The default client to connect to the system with */
	defaultClient: string;

	/** The default language to connect to the system with */
	defaultLanguage: string;

	/** The URL of the landscape provider that defines this system if applicable. */
	landscapeProviderUrl?: string;
};

/**
 * A system definition with its origin from a landscape provider.
 */
export type LandscapeSystem = {
	connection: Connection;

	systemId: string;

	name: string;

	description: string;
};

export function isRfcConnection(
	connection: Connection,
): connection is RfcConnection {
	return connection.kind === ConnectionProtocols.RFC;
}

export function isHttpConnection(
	connection: Connection,
): connection is HttpConnection {
	return connection.kind === ConnectionProtocols.HTTP;
}

export function isGroupSelection(
	params: RfcConnectionParams,
): params is RfcCommonProperties & RfcGroupSelection {
	return params.connectionType === ConnectionTypes.GroupSelection;
}

export function isApplicationServer(
	params: RfcConnectionParams,
): params is RfcCommonProperties & RfcCustomApplicationServer {
	return params.connectionType === ConnectionTypes.CustomApplicationServer;
}
