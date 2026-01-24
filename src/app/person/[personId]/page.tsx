import { notFound } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/client";

interface PersonPageProps {
  params: Promise<{ personId: string }>;
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { personId } = await params;
  const personIdNum = parseInt(personId);

  if (isNaN(personIdNum)) {
    notFound();
  }

  // Verify person exists
  const person = await prisma.person.findUnique({
    where: { id: personIdNum },
    select: {
      id: true,
      name: true,
      profilePath: true,
    },
  });

  if (!person) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Person Image */}
          {person.profilePath && (
            <div className="mb-8 flex justify-center">
              <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-green-500">
                <Image
                  src={`https://image.tmdb.org/t/p/w500${person.profilePath}`}
                  alt={person.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 192px, 256px"
                />
              </div>
            </div>
          )}

          {/* Person Name */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {person.name}
          </h1>

          {/* Coming Soon Message */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-green-400 mb-3">
              Cast Member Profile Pages Coming Soon
            </h2>
            <p className="text-gray-300 text-lg">
              We&apos;re working on bringing you detailed cast member profiles with
              their appearances, character information, and more. Check back
              soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PersonPageProps) {
  const { personId } = await params;
  const personIdNum = parseInt(personId);

  if (isNaN(personIdNum)) {
    return {
      title: "Person Not Found",
    };
  }

  const person = await prisma.person.findUnique({
    where: { id: personIdNum },
    select: { name: true },
  });

  if (!person) {
    return {
      title: "Person Not Found",
    };
  }

  return {
    title: `${person.name} - Cast Member Profile`,
    description: `Cast member profile page for ${person.name}. Profile pages coming soon!`,
  };
}
