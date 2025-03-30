'use client';
import { useCallback } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const PriceRange = ({
    min,
    max,
    currentMin,
    currentMax,
    onChange,
}: {
    min: number;
    max: number;
    currentMin: number;
    currentMax: number;
    onChange: (min: number, max: number) => void;
}) => {
    const handleChange = useCallback(
        (values: number | number[]) => {
            if (Array.isArray(values)) {
                onChange(values[0], values[1]);
            }
        },
        [onChange]
    );

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Price Range</h3>
            <Slider
                range
                min={min}
                max={max}
                value={[currentMin, currentMax]}
                onChange={handleChange}
                trackStyle={[{ backgroundColor: '#3b82f6' }]}
                handleStyle={[
                    { borderColor: '#3b82f6', boxShadow: 'none' },
                    { borderColor: '#3b82f6', boxShadow: 'none' },
                ]}
            />
            <div className="flex justify-between text-sm text-gray-600">
                <span>${currentMin}</span>
                <span>${currentMax}</span>
            </div>
        </div>
    );
};

export default PriceRange;