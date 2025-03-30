'use client';
import { FiCheck, FiDollarSign, FiTag, FiSearch, FiX } from 'react-icons/fi';
import PriceRange from './PriceRange';

interface ProductFiltersProps {
    filters: {
        minPrice: number;
        maxPrice: number;
        categories: string[];
        searchQuery: string;
    };
    categories: string[];
    onFilterChange: (filters: any) => void;
}

const ProductFilters = ({ filters, categories, onFilterChange }: ProductFiltersProps) => (
    <div className="space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <FiTag className="w-5 h-5 text-blue-600" />
            Product Filters
        </h2>

        <div className="space-y-5">
            {/* Price Range Filter */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FiDollarSign className="w-4 h-4 text-gray-500" />
                    Price Range
                </label>
                <PriceRange
                    absoluteMin={0}
                    absoluteMax={1000}
                    currentMin={filters.minPrice}
                    currentMax={filters.maxPrice}
                    onChange={(min, max) => onFilterChange({ ...filters, minPrice: min, maxPrice: max })}
                />
                <div className="text-sm text-gray-500 flex justify-between">
                    <span>${filters.minPrice}</span>
                    <span>${filters.maxPrice}</span>
                </div>
            </div>

            {/* Categories Filter */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FiTag className="w-4 h-4 text-gray-500" />
                    Categories
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {categories.map(category => (
                        <label
                            key={category}
                            className="flex items-center gap-3 group cursor-pointer p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            <div className={`relative w-5 h-5 border rounded-md transition-colors ${filters.categories.includes(category)
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white border-gray-300 group-hover:border-blue-400'
                                }`}>
                                {filters.categories.includes(category) && (
                                    <FiCheck className="absolute inset-0 w-full h-full text-white p-0.5" />
                                )}
                            </div>
                            <span className="text-gray-700 group-hover:text-gray-900">
                                {category}
                            </span>
                            <input
                                type="checkbox"
                                checked={filters.categories.includes(category)}
                                onChange={(e) => {
                                    const newCategories = e.target.checked
                                        ? [...filters.categories, category]
                                        : filters.categories.filter(c => c !== category);
                                    onFilterChange({ ...filters, categories: newCategories });
                                }}
                                className="hidden"
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FiSearch className="w-4 h-4 text-gray-500" />
                    Search Products
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name or brand..."
                        value={filters.searchQuery}
                        onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    {filters.searchQuery && (
                        <button
                            onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export default ProductFilters;