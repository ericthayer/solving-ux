/** Build-time flag. Design system team builds set VITE_ENABLE_EDITOR=true. */
export const editorEnabled: boolean = __TEAM_BUILD__ && import.meta.env.VITE_ENABLE_EDITOR === 'true';

/** Path prefix the app is served under: '' for the root, '/<path>' for a client build. Used for absolute links and storage keys. */
export const basePath: string = import.meta.env.BASE_URL.replace(/\/$/, '');
