import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();
// Request Google Calendar scope
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.setCustomParameters({
  prompt: "select_account"
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory and local storage to survive page refreshes.
let cachedAccessToken: string | null = null;
try {
  if (typeof window !== "undefined") {
    cachedAccessToken = localStorage.getItem("dg_google_access_token");
  }
} catch (e) {
  console.warn("Could not read dg_google_access_token on init", e);
}

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== "undefined") {
        try {
          cachedAccessToken = localStorage.getItem("dg_google_access_token");
        } catch (e) {}
      }

      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in but no token in memory, we need them to authenticate again to get the token,
        // or we can handle it gracefully.
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("dg_google_access_token");
        }
      } catch (e) {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Firebase Auth");
    }

    cachedAccessToken = credential.accessToken;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("dg_google_access_token", cachedAccessToken);
      }
    } catch (e) {}
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  if (!cachedAccessToken && typeof window !== "undefined") {
    try {
      cachedAccessToken = localStorage.getItem("dg_google_access_token");
    } catch (e) {}
  }
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("dg_google_access_token");
    }
  } catch (e) {}
};
