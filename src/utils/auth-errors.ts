type AuthLikeError = {
  code?: string;
  message?: string;
};

const getCurrentHost = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location.hostname;
};

const getCurrentOrigin = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location.origin;
};

const buildAuthorizedDomainHint = (host: string | null) => {
  if (!host) {
    return 'Add your app domain to Firebase Console -> Authentication -> Settings -> Authorized domains.';
  }

  const localhostHint = host === '127.0.0.1'
    ? ' You are using 127.0.0.1; Firebase often has localhost pre-authorized, but not always 127.0.0.1.'
    : '';

  return `Add ${host} to Firebase Console -> Authentication -> Settings -> Authorized domains.${localhostHint}`;
};

export const toReadableGoogleSignInError = (error: unknown) => {
  const authError = (error ?? {}) as AuthLikeError;
  const host = getCurrentHost();
  const origin = getCurrentOrigin();
  const hostHint = buildAuthorizedDomainHint(host);

  if (authError.code === 'auth/unauthorized-domain' || authError.code === 'auth/app-not-authorized') {
    return `This app host is not authorized for Firebase Auth.${hostHint}`;
  }

  if (authError.code === 'auth/operation-not-allowed') {
    return 'Google sign-in is disabled for this Firebase project. Enable Google under Firebase Console -> Authentication -> Sign-in method.';
  }

  if (authError.code === 'auth/invalid-oauth-client-id') {
    return 'The Google OAuth client for this Firebase project is invalid or out of sync. Re-save the Google provider in Firebase Console -> Authentication -> Sign-in method.';
  }

  if (authError.code === 'auth/popup-blocked') {
    return 'The browser blocked the Google sign-in popup. Allow popups for this site and try again.';
  }

  if (authError.code === 'auth/popup-closed-by-user') {
    return 'The Google sign-in popup was closed before the flow completed.';
  }

  if (
    authError.code === 'auth/internal-error' ||
    authError.code === 'auth/network-request-failed' ||
    authError.message?.includes('The requested action is invalid')
  ) {
    return `Firebase’s auth helper rejected the sign-in request. The most common cause is an unauthorized app domain.${hostHint}${origin ? ` Current origin: ${origin}.` : ''}`;
  }

  if (authError.message) {
    return `Google sign-in failed. ${authError.message}`;
  }

  return `Google sign-in failed. ${hostHint}`;
};
