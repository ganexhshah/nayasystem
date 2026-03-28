import { initializeApp, getApps } from "firebase/app"
import { getAuth, GoogleAuthProvider, type UserCredential } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const firebaseAuth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export async function getGoogleIdToken(result: UserCredential): Promise<string> {
  const googleCredential = GoogleAuthProvider.credentialFromResult(result)

  if (googleCredential?.idToken) {
    return googleCredential.idToken
  }

  return result.user.getIdToken()
}
