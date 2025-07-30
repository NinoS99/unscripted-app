import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-6 mt-auto">
      <div className="md:px-8 lg:px-16 xl:px-32 2xl:px-64 mx-auto w-full">
        <p className="text-center text-sm">
          unscripted. Crafted from reality show lovers for reality show lovers. Show data from{' '}
          <Link 
            href="https://www.themoviedb.org/?language=en-CA" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            TMDB
          </Link>
          .
        </p>
      </div>
    </footer>
  );
} 