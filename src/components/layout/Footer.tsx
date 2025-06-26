import Link from 'next/link';

type FooterProps = {
  locale: string;
};

export default function Footer({ locale }: FooterProps) {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Link
              href={`/${locale}`}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
            >
              © {year} Forum
            </Link>
          </div>
          <div className="flex space-x-6">
            <Link
              href={`/${locale}/terms`}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
            >
              Terms
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
            >
              Privacy
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
