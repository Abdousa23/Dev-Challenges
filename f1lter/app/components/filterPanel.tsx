'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useDebouncedCallback } from 'use-debounce';
import FilterTabs from './FilterTabs';
import ProductFilters from './ProductFilters';
import UserFilters from './UserFilters';
import ErrorBoundary from './ErrorBoundary';
import { clientCache } from '@/lib/clientCache';
import { FiSearch, FiX, FiDollarSign, FiTag, FiUserCheck } from 'react-icons/fi';
import { FiInbox, FiRefreshCw } from 'react-icons/fi';

type FilterTab = 'products' | 'users';

const FilterPanel = () => {
    const [activeTab, setActiveTab] = useState<FilterTab>('products');
    const [filters, setFilters] = useState({
        products: {
            minPrice: 0,
            maxPrice: 1000,
            categories: [],
            searchQuery: '',
        },
        users: {
            active: false,
            country: '',
            company: '',
            job: '',
            searchQuery: '',
        }
    });

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categories = useMemo(() => ['Books', 'Food', 'Toys', 'Beauty', 'Clothing'], []);
    const countries = useMemo(() => ['USA', 'Canada', 'UK', 'Germany', 'Japan'], []);

    const fetchResults = useDebouncedCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = activeTab === 'products'
                ? filters.products
                : filters.users;

            const cacheKey = JSON.stringify({ type: activeTab, ...params });
            const cached = await clientCache.get(cacheKey);

            if (cached) {
                setResults(cached);
                return;
            }

            const baseUrl = `/api/filter/${activeTab}`;
            const searchParams = new URLSearchParams();

            if (activeTab === 'products') {
                // Type assertion for product filters
                const productParams = params as typeof filters.products;
                const { minPrice, maxPrice, categories, searchQuery } = productParams;

                if (minPrice !== undefined) searchParams.set('minPrice', minPrice.toString());
                if (maxPrice !== undefined) searchParams.set('maxPrice', maxPrice.toString());
                if (categories.length) searchParams.set('categories', categories.join(','));
                if (searchQuery) searchParams.set('searchQuery', searchQuery);
            } else {
                // Type assertion for user filters
                const userParams = params as typeof filters.users;
                const { active, country, company, job, searchQuery } = userParams;

                if (active !== undefined) searchParams.set('active', (active as any).toString());
                if (country) searchParams.set('country', country);
                if (company) searchParams.set('company', company);
                if (job) searchParams.set('job', job);
                if (searchQuery) searchParams.set('searchQuery', searchQuery);
            }
            const response = await fetch(`${baseUrl}?${searchParams}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setResults(data);
            await clientCache.set(cacheKey, data);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, 300);

    useEffect(() => {
        fetchResults();
    }, [activeTab, filters, fetchResults]);


    const theme = {
        primary: 'text-blue-600',
        primaryBg: 'bg-blue-50',
        border: 'border-gray-200',
        hover: 'hover:bg-blue-50/50',
    };

    const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div
            style={style}
            className={`px-4 py-3 ${theme.border} border-b ${theme.hover} transition-all duration-200 group`}
        >
            {activeTab === 'products' ? (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {results[index]?.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <FiTag className={theme.primary} />
                            {results[index]?.brand}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`font-medium flex items-center gap-1 ${theme.primary}`}>
                            <FiDollarSign />
                            {results[index]?.price?.toFixed(2)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${theme.primaryBg} ${theme.primary}`}>
                            {results[index]?.category}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {results[index]?.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <FiUserCheck className={theme.primary} />
                            {results[index]?.email}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${results[index]?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {results[index]?.active ? 'Active' : 'Inactive'}
                        </span>
                        {results[index]?.company && (
                            <p className="text-sm mt-2 text-gray-500">
                                {results[index]?.company}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    ), [activeTab, results]);

    return (
        <ErrorBoundary>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
                    {/* Filter Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

                            {activeTab === 'products' ? (
                                <ProductFilters
                                    filters={filters.products}
                                    categories={categories}
                                    onFilterChange={(newFilters) => setFilters(prev => ({
                                        ...prev,
                                        products: { ...prev.products, ...newFilters }
                                    }))}
                                />
                            ) : (
                                <UserFilters
                                    filters={filters.users}
                                    countries={countries}
                                    onFilterChange={(newFilters) => setFilters(prev => ({
                                        ...prev,
                                        users: { ...prev.users, ...newFilters }
                                    }))}

                                />
                            )
                            }
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100 relative">
                                <div className="flex items-center gap-2">
                                    <FiSearch className="text-black" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab}...`}
                                        value={activeTab === 'products' ? filters.products.searchQuery : filters.users.searchQuery}
                                        onChange={(e) => activeTab === 'products'
                                            ? setFilters(prev => ({ ...prev, products: { ...prev.products, searchQuery: e.target.value } }))
                                            : setFilters(prev => ({ ...prev, users: { ...prev.users, searchQuery: e.target.value } }))
                                        }
                                        className="w-full px-4 py-2 text-black border-0 focus:ring-0 focus:outline-none"
                                    />
                                    {(activeTab === 'products' ? filters.products.searchQuery : filters.users.searchQuery) && (
                                        <button
                                            onClick={() => activeTab === 'products'
                                                ? setFilters(prev => ({ ...prev, products: { ...prev.products, searchQuery: '' } }))
                                                : setFilters(prev => ({ ...prev, users: { ...prev.users, searchQuery: '' } }))
                                            }
                                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <FiX />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
                                    <FiXCircle className="text-red-500 flex-shrink-0" />
                                    <span className="text-red-600">{error}</span>
                                </div>
                            )}

                            {loading ? (
                                <div className="p-8 text-center text-gray-500 space-y-4">
                                    <div className="animate-pulse space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                            ) : results.length > 0 ? (
                                <List
                                    height={600}
                                    itemCount={results.length}
                                    itemSize={80}
                                    width="100%"
                                    className="scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 max-h-[60vh] overflow-y-auto"
                                >
                                    {Row}
                                </List>
                            ) : (
                                <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-4">
                                    <FiInbox className="w-12 h-12 text-gray-300" />
                                    <p className="text-lg">No {activeTab} found matching your criteria</p>
                                    <button
                                        onClick={() => {
                                            if (activeTab === 'products') {
                                                setFilters(prev => ({
                                                    ...prev,
                                                    products: { minPrice: 0, maxPrice: 1000, categories: [], searchQuery: '' }
                                                }));
                                            } else {
                                                setFilters(prev => ({
                                                    ...prev,
                                                    users: { active: undefined, country: '', company: '', job: '', searchQuery: '' }
                                                }));
                                            }
                                        }}
                                        className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                                    >
                                        <FiRefreshCw /> Reset Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};
export default FilterPanel;