"use client";

export default function PageSection({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    return (
        <section className="min-h-[60vh] py-20 bg-white text-gray-800">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif text-gray-900">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                        {subtitle}
                    </p>
                )}
                <div className="text-gray-700 space-y-6 leading-relaxed">
                    {children}
                </div>
            </div>
        </section>
    );
}
