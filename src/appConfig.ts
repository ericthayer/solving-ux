/** Build-time flag. Design system team builds set VITE_ENABLE_EDITOR=true. */
export const editorEnabled: boolean = import.meta.env.VITE_ENABLE_EDITOR === 'true';
