"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from "@clerk/nextjs";
import ProfilePopup from "./ProfilePopup";
import SearchBar from "./SearchBar";
import ClientOnly from "./ClientOnly";
import { FiFilm, FiBell, FiList, FiUser, FiMenu } from "react-icons/fi";

const Navbar = () => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close mobile menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setShowMobileMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="h-16 flex items-center justify-between px-4 relative z-40 bg-gradient-to-t from-gray-900/70 to-transparent p-4 container mx-auto">
            {/* LEFT - Logo */}
            <div className="flex-shrink-0">
                <Link href="/">
                    <Image
                        src="/default-monochrome.svg"
                        alt=""
                        width={160}
                        height={60}
                        className="mt-1 w-[120px] md:w-[140px] lg:w-[160px] transition-all duration-300"
                    />
                </Link>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10 justify-end">
                <ClerkLoading>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-solid border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                </ClerkLoading>
                <ClerkLoaded>
                    <SignedIn>
                        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center gap-2 lg:gap-4 xl:gap-6">
                                <NavButton
                                    icon={<FiFilm className="w-4 h-4 md:w-5 md:h-5 " />}
                                    text="Shows"
                                />
                                <NavButton
                                    icon={<FiBell className="w-4 h-4 md:w-5 md:h-5" />}
                                    text="Notifications"
                                />
                                <NavButton
                                    icon={<FiList className="w-4 h-4 md:w-5 md:h-5" />}
                                    text="Watch Lists"
                                    href="/watch-lists"
                                />
                            </div>
                            
                            {/* Mobile Icons Container - Equal Spacing */}
                            <div className="lg:hidden flex items-center justify-end w-32 gap-4">
                                <SearchBar />
                                
                                {/* Mobile Menu Button */}
                                <div className="relative" ref={mobileMenuRef}>
                                    <button
                                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                                        className="flex items-center justify-center h-10 w-10 text-white hover:text-green-500 transition-all rounded-full"
                                        aria-label="Mobile menu"
                                    >
                                        <FiMenu className="w-6 h-6" />
                                    </button>

                                    {/* Mobile Menu Dropdown - Vertical Layout */}
                                    {showMobileMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-md shadow-lg z-50 border border-gray-600 animate-fade-in">
                                            <div className="p-1">
                                                <MobileNavButton
                                                    icon={<FiFilm className="w-4 h-4" />}
                                                    text="Shows"
                                                    onClick={() => setShowMobileMenu(false)}
                                                />
                                                <MobileNavButton
                                                    icon={<FiBell className="w-4 h-4" />}
                                                    text="Notifications"
                                                    onClick={() => setShowMobileMenu(false)}
                                                />
                                                <MobileNavButton
                                                    icon={<FiList className="w-4 h-4" />}
                                                    text="Watch Lists"
                                                    href="/watch-lists"
                                                    onClick={() => setShowMobileMenu(false)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <ClientOnly fallback={<div className="w-9 h-9 rounded-full bg-gray-600 animate-pulse" />}>
                                    <ProfilePopup />
                                </ClientOnly>
                            </div>

                            {/* Desktop Search and Profile */}
                            <div className="hidden lg:flex items-center gap-2 lg:gap-4 xl:gap-6">
                                <SearchBar />
                                <ClientOnly fallback={<div className="w-9 h-9 rounded-full bg-gray-600 animate-pulse" />}>
                                    <ProfilePopup />
                                </ClientOnly>
                            </div>
                        </div>
                    </SignedIn>
                    <SignedOut>
                        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
                            <SearchBar />
                            <div className="flex items-center gap-2 text-sm md:text-base">
                                <FiUser className="w-5 h-5 md:w-6 md:h-6 text-green-200" />
                                <Link className="text-white text-lg hover:text-green-200 transition-all duration-300" href="/sign-in">
                                    Login/Sign Up
                                </Link>
                            </div>
                        </div>
                    </SignedOut>
                </ClerkLoaded>
            </div>
        </div>
    );
};

interface NavButtonProps {
    icon: React.ReactNode;
    text: string;
    href?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, text, href }) => {
    const content = (
        <div className="flex items-center gap-1 md:gap-2 text-white hover:text-green-600 transition-all duration-300 text-sm md:text-base font-medium cursor-pointer whitespace-nowrap">
            {icon}
            <span>{text}</span>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return <button>{content}</button>;
};

interface MobileNavButtonProps {
    icon: React.ReactNode;
    text: string;
    href?: string;
    onClick?: () => void;
}

const MobileNavButton: React.FC<MobileNavButtonProps> = ({ icon, text, href, onClick }) => {
    const content = (
        <div className="flex items-center gap-2 text-white hover:bg-gray-400 rounded px-4 py-2 text-sm font-medium cursor-pointer whitespace-nowrap">
            {icon}
            <span>{text}</span>
        </div>
    );

    if (href) {
        return <Link href={href} onClick={onClick}>{content}</Link>;
    }

    return <button onClick={onClick}>{content}</button>;
};

export default Navbar;