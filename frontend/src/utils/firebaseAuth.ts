import { createUserWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/firebaseConfig';

export type GoogleSignInResult = {
  firebaseIdToken: string;
  user: User;
};

export type EmailSignUpResult = {
  firebaseIdToken: string;
  user: User;
};

// Firebase exchanges the Google credential for a Firebase session. The backend
// then verifies the resulting Firebase ID token with Firebase Admin.
export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, googleProvider);
  return {
    firebaseIdToken: await result.user.getIdToken(),
    user: result.user
  };
};

export const signUpWithEmailAndPassword = async ({
  email,
  password,
  name
}: {
  email: string;
  password: string;
  name?: string;
}): Promise<EmailSignUpResult> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  if (name) {
    await updateProfile(result.user, { displayName: name });
  }

  return {
    firebaseIdToken: await result.user.getIdToken(),
    user: result.user
  };
};

export const signOutFromFirebase = () => signOut(auth);
