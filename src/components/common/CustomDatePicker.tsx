import { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
}

export default function CustomDatePicker({ value, onChange, label }: CustomDatePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="relative">
            {label && <label className="label">{label}</label>}
            <div
                className="input flex items-center gap-3 cursor-pointer group hover:border-[var(--primary)] transition-colors"
                onClick={() => inputRef.current?.showPicker()}
            >
                <Calendar className="w-5 h-5 text-[var(--primary)]" />
                <span className="text-[var(--text-primary)] font-medium">
                    {new Date(value).toLocaleDateString()}
                </span>
                <input
                    ref={inputRef}
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>
        </div>
    );
}
