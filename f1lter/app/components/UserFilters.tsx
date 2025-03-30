'use client';
import { FiCheck, FiGlobe, FiBriefcase, FiUser, FiSearch, FiChevronDown } from 'react-icons/fi';
import { FiTag } from 'react-icons/fi';
interface UserFiltersProps {
    filters: {
        active: boolean;
        country: string;
        company: string;
        job: string;
        searchQuery: string;
    };
    countries: string[];
    onFilterChange: (filters: any) => void;
}

const UserFilters = ({ filters, countries, onFilterChange }: UserFiltersProps) => (
    <div className="space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-black">
            <FiUser className="w-5 h-5 text-blue-600" />
            User Filters
        </h2>

        <div className="space-y-5">
            {/* Active Users Toggle */}
            <label className="flex items-center gap-3 group cursor-pointer">
                <div className={`relative w-9 h-5 rounded-full transition-colors ${filters.active ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${filters.active ? 'translate-x-4' : ''
                        }`} />
                </div>
                <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                    Active Users
                </span>
                <input
                    type="checkbox"
                    checked={filters.active}
                    onChange={(e) => onFilterChange({ ...filters, active: e.target.checked })}
                    className="hidden"
                />
            </label>

            {/* Country Select */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FiGlobe className="w-4 h-4 text-gray-500" />
                    Country
                </label>
                <div className="relative">
                    <select
                        value={filters.country}
                        onChange={(e) => onFilterChange({ ...filters, country: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border text-black border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none"
                    >
                        <option value="" className='text-black'>All Countries</option>
                        {countries.map(country => (
                            <option
                                key={country}
                                value={country}
                                className="py-2 hover:bg-blue-50 text-black"
                            >
                                {country}
                            </option>
                        ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Company Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Company
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={filters.company}
                        onChange={(e) => onFilterChange({ ...filters, company: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-black text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    <FiBriefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* Job Title Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FiBriefcase className="w-4 h-4 text-gray-500" />
                    Job Title
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filter by job title..."
                        value={filters.job}
                        onChange={(e) => onFilterChange({ ...filters, job: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-black text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    <FiTag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FiSearch className="w-4 h-4 text-gray-500" />
                    Search Users
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={filters.searchQuery}
                        onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
                        className="w-full pl-10 pr-4 text-black py-2.5 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                    <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
            </div>
        </div>
    </div>
);

export default UserFilters;