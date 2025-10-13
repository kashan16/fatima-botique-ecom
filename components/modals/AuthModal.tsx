"use client";

import { useSession, useSignIn, useSignUp } from "@clerk/nextjs";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiUser, FiX } from "react-icons/fi";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type AuthMode = "login" | "signup" | "forgotPassword";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  toggleVisibility: () => void;
  required?: boolean;
  placeholder?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  toggleVisibility,
  showPassword,
  required = true,
  placeholder = "",
}) => (
  <div className="relative">
    <Input
      id={id}
      name={id}
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-black/20 backdrop-blur-md border border-white/30 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
    />
    <Button
      type="button"
      onClick={toggleVisibility}
      className="absolute inset-y-0 right-0 px-3 flex items-center bg-transparent text-white hover:text-indigo-400 transition-colors"
      aria-label={showPassword ? "Hide Password" : "Show Password"}
      variant="ghost"
      size="sm"
    >
      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
    </Button>
  </div>
);

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
}

interface FormValues {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
}

export const AuthModal = ({ open, onClose, defaultMode = "login" }: AuthModalProps) => {
  const { isLoaded, isSignedIn } = useSession();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const [currMode, setCurrMode] = useState<AuthMode>(defaultMode);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (open) {
      setCurrMode(defaultMode);
      setAuthError(null);
      setEmailSent(false);
      setShowPassword(false);
      setFormValues({ email: "", password: "", username: "", confirmPassword: "" });
    }
  }, [open, defaultMode]);

  useEffect(() => {
    if (isSignedIn && isLoaded) onClose();
  }, [isSignedIn, isLoaded, onClose]);

  const handleInputChange = (field: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const isFormValid = () => {
    const { email, password, username, confirmPassword } = formValues;
    if (currMode === "login") return email.trim() && password.trim();
    if (currMode === "signup")
      return email.trim() && password.trim() && username.trim() && password === confirmPassword && password.length >= 8;
    if (currMode === "forgotPassword") return email.trim();
    return false;
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid() || authLoading || !signInLoaded || !signUpLoaded) return;

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (currMode === "signup") {
        const captcha = document.getElementById('clerk-captcha');
        if(!captcha) console.warn('Clerk CAPTCHA container is missing');
        const result = await signUp.create({
          emailAddress: formValues.email,
          password: formValues.password,
          username: formValues.username,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          onClose();
        } else {
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setEmailSent(true);
        }
      } else if (currMode === "login") {
        const result = await signIn.create({
          identifier: formValues.email,
          password: formValues.password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          onClose();
        } else {
          setAuthError("Sign in failed. Please check your credentials.");
        }
      } else if (currMode === "forgotPassword") {
        await signIn.create({ strategy: "reset_password_email_code", identifier: formValues.email });
        setEmailSent(true);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signInLoaded || authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: window.location.origin,
        redirectUrlComplete: window.location.origin,
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setAuthError("Google sign-in failed. Please try again.");
      setAuthLoading(false);
    }
  };

  const modalContent = {
    login: {
      icon: <FiLock className="w-10 h-10 text-indigo-400" />,
      title: "Welcome Back",
      subtitle: "Sign in to continue",
      submitButton: "Sign In",
      submittingButton: "Signing In...",
      toggleText: "Don't have an account?",
      toggleLink: "Sign Up",
    },
    signup: {
      icon: <FiUser className="w-10 h-10 text-green-400" />,
      title: "Create Your Account",
      subtitle: "Join Fatima Boutique",
      submitButton: "Sign Up",
      submittingButton: "Creating Account...",
      toggleText: "Already have an account?",
      toggleLink: "Sign In",
    },
    forgotPassword: {
      icon: <FiMail className="w-10 h-10 text-pink-400" />,
      title: "Reset Password",
      subtitle: "Enter your email to receive a reset link",
      submitButton: "Send Reset Link",
      submittingButton: "Sending...",
      toggleText: "Remembered your password?",
      toggleLink: "Sign In",
    },
  };

  const currentContent = modalContent[currMode as keyof typeof modalContent];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" aria-hidden="true" />
        </Transition.Child>

        {/* Modal panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative w-full max-w-md mx-auto bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8 overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-indigo-400 transition-colors p-2 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto mb-4">{currentContent.icon}</div>
                <Dialog.Title className="text-2xl font-bold text-white">{currentContent.title}</Dialog.Title>
                <p className="text-white/70 mt-1">{currentContent.subtitle}</p>
              </div>

              {authError && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700/40 rounded-lg text-red-400 text-sm">
                  {authError}
                </div>
              )}

              {(currMode === "signup" || currMode === "forgotPassword") && emailSent ? (
                <div className="text-center p-6 bg-green-900/20 border border-green-700/40 rounded-lg">
                  <FiCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h4 className="font-semibold text-lg text-white">Email Sent!</h4>
                  <p className="text-white/70 mt-2 text-sm">
                    {currMode === "signup"
                      ? `Check your email at ${formValues.email} to verify your account.`
                      : `If an account exists, you'll receive a reset link at ${formValues.email}.`}
                  </p>
                  <Button
                    onClick={() => {
                      setCurrMode("login");
                      setEmailSent(false);
                      setFormValues({ ...formValues, password: "", confirmPassword: "" });
                    }}
                    className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {currMode === "signup" && (
                      <div className="space-y-2">
                        <label htmlFor="username" className="text-white font-semibold text-sm">
                          Username
                        </label>
                        <Input
                          id="username"
                          value={formValues.username}
                          onChange={handleInputChange("username")}
                          placeholder="Choose your username"
                          required
                          className="w-full px-4 py-3 bg-black/20 backdrop-blur-md border border-white/30 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-white font-semibold text-sm">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleInputChange("email")}
                        placeholder="Enter your email"
                        required
                        className="w-full px-4 py-3 bg-black/20 backdrop-blur-md border border-white/30 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
                      />
                    </div>
                    {currMode !== "forgotPassword" && (
                      <PasswordInput
                        id="password"
                        value={formValues.password}
                        onChange={handleInputChange("password")}
                        showPassword={showPassword}
                        toggleVisibility={() => setShowPassword((p) => !p)}
                        placeholder="Enter your password"
                      />
                    )}
                    {currMode === "signup" && (
                      <PasswordInput
                        id="confirmPassword"
                        value={formValues.confirmPassword}
                        onChange={handleInputChange("confirmPassword")}
                        showPassword={showPassword}
                        toggleVisibility={() => setShowPassword((p) => !p)}
                        placeholder="Confirm your password"
                      />
                    )}

                    <Button
                      type="submit"
                      disabled={!isFormValid() || authLoading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {authLoading ? "Loading..." : currentContent.submitButton}
                    </Button>
                  </form>

                  <div className="my-6 text-center text-sm text-white/70 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/30" />
                    </div>
                    <span className="relative px-3 bg-black/20 backdrop-blur-md rounded-full">{currMode !== "forgotPassword" ? "Or continue with" : ""}</span>
                  </div>

                  {currMode !== "forgotPassword" && (
                    <Button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="w-full py-3 px-4 bg-black/20 backdrop-blur-md border border-white/30 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-black/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FcGoogle size={22} />
                      Sign in with Google
                    </Button>
                  )}
                </>
              )}

              <div className="mt-6 text-center text-white/70 text-sm">
                {currentContent.toggleText}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCurrMode(currMode === "login" ? "signup" : "login");
                    setAuthError(null);
                    setEmailSent(false);
                    setFormValues({ ...formValues, password: "", confirmPassword: "" });
                  }}
                  className="font-semibold text-indigo-400 hover:text-green-400 transition-colors ml-1"
                >
                  {currentContent.toggleLink}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
