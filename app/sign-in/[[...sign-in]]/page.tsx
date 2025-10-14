// app/sign-in/[[...sign-in]]/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SignIn, useUser } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();
  
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.push('/');
        }
    }, [isLoaded, isSignedIn, router]);
  
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-6">
                {/* Header */}
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to store</span>
                    </Link>
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <h1 className="text-3xl font-bold text-gray-900 font-serif">Fatima Boutique</h1>
                    </div>
                <h2 className="text-2xl font-bold text-gray-900 font-sans mt-4">
                    Welcome Back
                </h2>
                <p className="text-gray-600 mt-2">
                    Sign in to your account to continue
                </p>
            </div>
            {/* Sign In Card */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 text-center py-6">
                    <CardTitle className="text-xl font-semibold text-gray-900 font-sans">
                        Sign In to Your Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <SignIn 
                        routing="path"
                        path="/sign-in"
                        signUpUrl="/sign-up"
                        redirectUrl="/"
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-transparent shadow-none border-none",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: 
                                "border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-sm w-full mb-3",
                                socialButtonsBlockButtonText: "text-sm font-medium",
                                socialButtonsProviderIcon: "w-5 h-5",
                                formButtonPrimary:
                                "bg-gray-900 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-sm w-full mt-4",
                                formFieldInput:
                                "border border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 rounded-lg py-3 px-4 transition-all duration-200 bg-white",
                                formFieldLabel: "text-gray-700 font-medium text-sm mb-2",
                                footerActionLink: "text-gray-900 hover:text-gray-700 font-medium transition-colors duration-200",
                                formHeaderTitle: "hidden",
                                formHeaderSubtitle: "hidden",
                                identityPreviewEditButton: "text-gray-900 hover:text-gray-700 bg-gray-100 hover:bg-gray-200",
                                userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-50",
                                dividerLine: "bg-gray-200",
                                dividerText: "text-gray-500 text-xs",
                                formResendCodeLink: "text-gray-900 hover:text-gray-700",
                                alert: "bg-blue-50 text-blue-700 border-blue-200 rounded-lg",
                            },
                            layout: {
                                socialButtonsPlacement: "bottom",
                                socialButtonsVariant: "blockButton",
                                showOptionalFields: false,
                            },
                            variables: {
                                colorPrimary: "#111827", // gray-900
                                colorText: "#374151", // gray-700
                                colorTextSecondary: "#6B7280", // gray-500
                                }
                            }}
                        />
                    </CardContent>
                </Card>
                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                    <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-gray-900 hover:text-gray-700 transition-colors duration-200"
                    asChild>
                        <Link href="/sign-up">
                            Create account
                        </Link>
                    </Button>
                    </p>
                </div>
            </div>
        </div>
    );
}