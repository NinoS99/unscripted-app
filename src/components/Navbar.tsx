import Link from "next/link";
import Image from "next/image";
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from "@clerk/nextjs";
import ProfilePopup from "./ProfilePopup";
import SearchBar from "./SearchBar";
import { FiFilm, FiBell, FiEdit2 } from "react-icons/fi";

const Navbar = () => {
    return (
        <div className="h-16 flex items-center justify-between px-4 relative z-40 bg-gradient-to-t from-gray-600/70 to-transparent p-4 container mx-auto">
            {/* LEFT - Logo */}
            <div className="md:hidden lg:block">
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
                            <div className="hidden md:flex items-center gap-2 lg:gap-4 xl:gap-6">
                                <NavButton
                                    icon={<FiFilm className="w-4 h-4 md:w-5 md:h-5 " />}
                                    text="Shows"
                                />
                                <NavButton
                                    icon={<FiBell className="w-4 h-4 md:w-5 md:h-5" />}
                                    text="Notifications"
                                />
                                <NavButton
                                    icon={<FiEdit2 className="w-4 h-4 md:w-5 md:h-5" />}
                                    text="Reviews"
                                />
                            </div>
                            <SearchBar />
                            <ProfilePopup />
                        </div>
                    </SignedIn>
                    <SignedOut>
                        <div className="flex items-center gap-2 text-sm md:text-base">
                            <Image
                                src="/login.png"
                                alt=""
                                width={20}
                                height={20}
                                className="w-5 h-5 md:w-6 md:h-6"
                            />
                            <Link className="text-green-500 text-lg" href="/sign-in">
                                Login/Register
                            </Link>
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
}

const NavButton: React.FC<NavButtonProps> = ({ icon, text }) => (
    <button className="flex items-center gap-1 md:gap-2 text-white hover:text-green-600 transition-all duration-300 text-sm md:text-base font-medium cursor-pointer whitespace-nowrap">
        {icon}
        <span>{text}</span>
    </button>
);

export default Navbar;