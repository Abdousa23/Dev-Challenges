'use client';
import { useMemo } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';

const CategoryFilter = ({
    categories,
    selected,
    onChange,
}: {
    categories: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
}) => {
    const sortedCategories = useMemo(() => [...categories].sort(), [categories]);

    const handleCheckedChange = (category: string, checked: boolean) => {
        const newSelected = checked
            ? [...selected, category]
            : selected.filter(c => c !== category);
        onChange(newSelected);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Categories</h3>
            <div className="space-y-2">
                {sortedCategories.map(category => (
                    <label
                        key={category}
                        className="flex items-center space-x-2 group cursor-pointer"
                    >
                        <Checkbox.Root
                            checked={selected.includes(category)}
                            onCheckedChange={checked => handleCheckedChange(category, !!checked)}
                            className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white group-hover:border-blue-500 transition-colors"
                        >
                            <Checkbox.Indicator className="text-blue-600">
                                <CheckIcon className="h-4 w-4" />
                            </Checkbox.Indicator>
                        </Checkbox.Root>
                        <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                            {category}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default CategoryFilter;