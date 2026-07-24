import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Inspiration tab data ── */
const INSPIRATION_TABS = [
  'Popular',
  'Arts & Culture',
  'Outdoors',
  'Mountains',
  'Beach',
  'Unique stays',
  'Categories',
  'Things to do',
] as const;

const DESTINATION_DATA: Record<string, { city: string; description: string }[]> = {
  Popular: [
    { city: 'Boston', description: 'Entire home' },
    { city: 'Cambridge', description: 'Apartment rentals' },
    { city: 'Provincetown', description: 'Beach house rentals' },
    { city: 'Cape Cod', description: 'Cottage rentals' },
    { city: 'Salem', description: 'Vacation rentals' },
    { city: 'Martha\'s Vineyard', description: 'House rentals' },
    { city: 'Nantucket', description: 'Vacation rentals' },
    { city: 'Plymouth', description: 'Cabin rentals' },
    { city: 'Newport', description: 'Apartment rentals' },
    { city: 'Portland', description: 'Vacation rentals' },
    { city: 'Bar Harbor', description: 'House rentals' },
    { city: 'Kennebunkport', description: 'Cottage rentals' },
  ],
  'Arts & Culture': [
    { city: 'Boston', description: 'Rentals with museums' },
    { city: 'Cambridge', description: 'Historic walks' },
    { city: 'Salem', description: 'Cultural experiences' },
    { city: 'Provincetown', description: 'Art gallery visits' },
    { city: 'Newport', description: 'Mansion tours' },
    { city: 'Plymouth', description: 'Historical tours' },
  ],
  Outdoors: [
    { city: 'Cape Cod', description: 'Nature trips' },
    { city: 'Acadia', description: 'Park stays' },
    { city: 'White Mountains', description: 'Hiking trips' },
    { city: 'Berkshires', description: 'Outdoor adventures' },
    { city: 'Martha\'s Vineyard', description: 'Beach activities' },
    { city: 'Nantucket', description: 'Kayaking trips' },
  ],
  Mountains: [
    { city: 'White Mountains', description: 'Cabin rentals' },
    { city: 'Berkshires', description: 'Mountain retreats' },
    { city: 'Green Mountains', description: 'Ski lodges' },
    { city: 'Killington', description: 'Winter stays' },
    { city: 'Stowe', description: 'Mountain homes' },
    { city: 'Woodstock', description: 'Countryside stays' },
  ],
  Beach: [
    { city: 'Cape Cod', description: 'Beachfront stays' },
    { city: 'Martha\'s Vineyard', description: 'Beach houses' },
    { city: 'Nantucket', description: 'Oceanfront homes' },
    { city: 'Provincetown', description: 'Beach rentals' },
    { city: 'Narragansett', description: 'Beach cottages' },
    { city: 'Block Island', description: 'Seaside stays' },
  ],
  'Unique stays': [
    { city: 'Cape Cod', description: 'Treehouses' },
    { city: 'Vermont', description: 'Tiny homes' },
    { city: 'Maine', description: 'Lighthouse stays' },
    { city: 'Berkshires', description: 'Yurt rentals' },
    { city: 'New Hampshire', description: 'Glamping sites' },
    { city: 'Connecticut', description: 'Barn stays' },
  ],
  Categories: [
    { city: 'Entire homes', description: 'Comfortable spaces' },
    { city: 'Cabins', description: 'Cosy retreats' },
    { city: 'Apartments', description: 'City living' },
    { city: 'Treehouses', description: 'Unique stays' },
    { city: 'Lakefront', description: 'Waterside homes' },
    { city: 'Beachfront', description: 'Ocean views' },
  ],
  'Things to do': [
    { city: 'Freedom Trail', description: 'Walking tours' },
    { city: 'Whale watching', description: 'Ocean experiences' },
    { city: 'Lobster dinners', description: 'Food experiences' },
    { city: 'Sailing trips', description: 'Water activities' },
    { city: 'Brewery tours', description: 'Craft beer tasting' },
    { city: 'Kayaking', description: 'Water adventures' },
  ],
};

/* ── Footer links ── */
const SUPPORT_LINKS = [
  'Help Centre',
  'AirCover',
  'Anti-discrimination',
  'Disability support',
  'Cancellation options',
  'Report neighbourhood concern',
];

const HOSTING_LINKS = [
  'EchoStay your home',
  'AirCover for Hosts',
  'Hosting resources',
  'Community forum',
  'Hosting responsibly',
  'Join a free Hosting class',
];

const ECHOSTAY_LINKS = [
  'Newsroom',
  'New features',
  'Careers',
  'Investors',
  'Gift cards',
  'EchoStay.org emergency stays',
];

export default function Footer() {
  const [activeTab, setActiveTab] = useState<string>('Popular');

  const destinations = DESTINATION_DATA[activeTab] || [];

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      {/* ── Section 1: Inspiration ── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <h2 className="text-[22px] font-semibold text-gray-900 mb-4">
          Inspiration for future getaways
        </h2>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-300 mb-6 overflow-x-auto">
          {INSPIRATION_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Destination grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
          {destinations.map((dest) => (
            <Link
              key={dest.city}
              to={`/search?q=${encodeURIComponent(dest.city)}`}
              className="group"
            >
              <p className="text-sm font-medium text-gray-900 group-hover:underline">
                {dest.city}
              </p>
              <p className="text-sm text-gray-500">{dest.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Section 2: Three-column links ── */}
      <div className="border-t border-gray-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="space-y-3">
                {SUPPORT_LINKS.map((link) => (
                  <li key={link}>
                    <Link to="/help" className="text-sm text-gray-600 hover:underline hover:text-gray-900">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hosting */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Hosting</h3>
              <ul className="space-y-3">
                {HOSTING_LINKS.map((link) => (
                  <li key={link}>
                    <Link to="/hosting" className="text-sm text-gray-600 hover:underline hover:text-gray-900">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* EchoStay */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">EchoStay</h3>
              <ul className="space-y-3">
                {ECHOSTAY_LINKS.map((link) => (
                  <li key={link}>
                    <Link to="/help" className="text-sm text-gray-600 hover:underline hover:text-gray-900">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Bottom bar ── */}
      <div className="border-t border-gray-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: copyright & links */}
            <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
              <span>© 2025 EchoStay, Inc.</span>
              <span className="mx-1">·</span>
              <Link to="/help" className="hover:underline">Terms</Link>
              <span className="mx-1">·</span>
              <Link to="/help" className="hover:underline">Sitemap</Link>
              <span className="mx-1">·</span>
              <Link to="/help" className="hover:underline">Privacy</Link>
              <span className="mx-1">·</span>
              <Link to="/help" className="hover:underline">Your Privacy Choices</Link>
            </div>

            {/* Right: language, currency, social */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:underline">
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M1.5 8h13M8 1.5c-2 2.5-2 11 0 13M8 1.5c2 2.5 2 11 0 13" />
                </svg>
                English (US)
              </button>
              <button className="text-sm font-medium text-gray-700 hover:underline">
                $ USD
              </button>

              {/* Social icons */}
              <div className="flex items-center gap-3 ml-2">
                {/* Facebook */}
                <a href="#" className="text-gray-700 hover:text-gray-900" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                  </svg>
                </a>
                {/* Twitter / X */}
                <a href="#" className="text-gray-700 hover:text-gray-900" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="text-gray-700 hover:text-gray-900" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
