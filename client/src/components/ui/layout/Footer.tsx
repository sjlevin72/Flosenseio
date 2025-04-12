import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
        <div className="text-neutral-500 text-sm mb-2 sm:mb-0">
          © {currentYear} <span className="text-primary font-medium">Flo</span><span className="font-medium">sense.io</span>. All rights reserved.
        </div>
        <div className="flex space-x-6">
          <Link href="#privacy">
            <span className="text-neutral-500 hover:text-neutral-700 text-sm cursor-pointer">
              Privacy Policy
            </span>
          </Link>
          <Link href="#terms">
            <span className="text-neutral-500 hover:text-neutral-700 text-sm cursor-pointer">
              Terms of Service
            </span>
          </Link>
          <Link href="#help">
            <span className="text-neutral-500 hover:text-neutral-700 text-sm cursor-pointer">
              Help Center
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
