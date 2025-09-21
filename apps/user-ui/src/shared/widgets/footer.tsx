"use client";
import { Facebook, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { usePathname } from "next/navigation";

const Footer = () => {
  //dont show the fooler for chat screen
  const pathname = usePathname();
  if (pathname === "/inbox") return null;
  return (
    <footer className="w-full bg-gray-800 text-gray-200 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1 - About */}
        <div>
          <p className="text-sm leading-relaxed">
            Perfect ecommerce platform to start your business from scratch.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-800 hover:bg-blue-600 hover:text-white cursor-pointer transition">
              <Facebook size={18} />
            </div>
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-800 hover:bg-blue-700 hover:text-white cursor-pointer transition">
              <Linkedin size={18} />
            </div>
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-800 hover:bg-sky-500 hover:text-white cursor-pointer transition">
              <Twitter size={18} />
            </div>
          </div>
        </div>

        {/* Column 2 - My Account */}
        <div>
          <h2 className="text-lg font-semibold mb-4">My Account</h2>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Track Orders</li>
            <li className="hover:text-white cursor-pointer">Shopping</li>
            <li className="hover:text-white cursor-pointer">Wishlist</li>
            <li className="hover:text-white cursor-pointer">My Account</li>
            <li className="hover:text-white cursor-pointer">Order History</li>
            <li className="hover:text-white cursor-pointer">Returns</li>
          </ul>
        </div>

        {/* Column 3 - Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Information</h2>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Our Story</li>
            <li className="hover:text-white cursor-pointer">Careers</li>
            <li className="hover:text-white cursor-pointer">Privacy Policy</li>
            <li className="hover:text-white cursor-pointer">
              Terms & Conditions
            </li>
            <li className="hover:text-white cursor-pointer">Latest News</li>
            <li className="hover:text-white cursor-pointer">Contact Us</li>
          </ul>
        </div>

        {/* Column 4 - Talk to Us */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Talk To Us</h2>
          <p className="text-sm mb-2">Got Questions? Call us</p>

          <div className="flex items-center gap-2 mb-3">
            <Phone size={18} className="text-blue-400" />
            <span className="font-bold text-base">+670 4139 0762</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-blue-400" />
            <span className="text-sm">support@shopstack.com</span>
          </div>

          <div className="flex items-start gap-2">
            <MapPin size={18} className="text-blue-400 mt-1" />
            <span className="text-sm leading-snug">
              79 Steepy Hollow St. <br />
              Jamaica, New York 1432
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
