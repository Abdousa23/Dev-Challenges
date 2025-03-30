'use client';

interface FilterTabsProps {
    activeTab: 'products' | 'users';
    onTabChange: (tab: 'products' | 'users') => void;
}

const FilterTabs = ({ activeTab, onTabChange }: FilterTabsProps) => (
    <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
            <button
                onClick={() => onTabChange('products')}
                className={`pb-4 px-1 ${activeTab === 'products'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Products
            </button>
            <button
                onClick={() => onTabChange('users')}
                className={`pb-4 px-1 ${activeTab === 'users'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Users
            </button>
        </nav>
    </div>
);

export default FilterTabs;