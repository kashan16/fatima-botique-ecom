'use client';

import { useSearchSuggestions, type SuggestionItem } from '@/hooks/useSearch';
import { Clock, Delete, Palette, Search, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Shadcn UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchBarProps {
    initialQuery?: string;
    className?: string;
    variant?: 'default' | 'glass';
}

export const SearchBar: React.FC<SearchBarProps> = ({
    initialQuery = '',
    className = '',
    variant = 'glass'
}) => {
    const [query, setQuery] = useState(initialQuery);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
  
    const { data: suggestionsData, isLoading: suggestionsLoading } = useSearchSuggestions(query);
    const suggestions = suggestionsData?.suggestions || [];
  
    const handleSearch = (searchQuery: string = query) => {
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
            router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
        }
        setIsSuggestionsOpen(false);
        setIsFocused(false);
    };
  
    const handleSuggestionClick = (suggestion: SuggestionItem) => {
        let searchUrl = '/search';
        const params = new URLSearchParams();
    
        // Updated to use suggestion_type instead of type
        switch (suggestion.suggestion_type) {
            case 'product':
                // For product suggestions, navigate directly to the product page if we have the slug
                if (suggestion.metadata?.slug) {
                    router.push(`/products/${suggestion.metadata.slug}`);
                    setIsSuggestionsOpen(false);
                    setIsFocused(false);
                    return;
                } else {
                    params.append('q', suggestion.value);
                }
                break;
            case 'category':
                params.append('categories', suggestion.metadata?.id || '');
                break;
            case 'color':
                params.append('colors', suggestion.value);
                break;
        }
    
        if (params.toString()) {
            searchUrl += `?${params.toString()}`;
        }
    
        router.push(searchUrl);
        setIsSuggestionsOpen(false);
        setIsFocused(false);
    };
  
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setIsSuggestionsOpen(false);
            setIsFocused(false);
        }
    };
  
    const clearSearch = () => {
        setQuery('');
        setIsSuggestionsOpen(false);
        inputRef.current?.focus();
    };
  
    const handleFocus = () => {
        setIsFocused(true);
        setIsSuggestionsOpen(true);
    };
  
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setIsSuggestionsOpen(false);
                setIsFocused(false);
            }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    // Glass variant styles
    const glassStyles = variant === 'glass' 
    ? 'bg-white/80 backdrop-blur-md border-white/20 shadow-lg'
    : 'bg-white border-gray-200 shadow-sm';
  
    // Updated to use suggestion_type
    const getSuggestionIcon = (suggestion_type: SuggestionItem['suggestion_type']) => {
        switch (suggestion_type) {
            case 'product':
                return <Clock className="w-4 h-4" />;
            case 'category':
                return <Tag className="w-4 h-4" />;
            case 'color':
                return <Palette className="w-4 h-4" />;
            default:
                return <Search className="w-4 h-4" />;
        }
    };
  
    // Updated to use suggestion_type
    const getSuggestionColor = (suggestion_type: SuggestionItem['suggestion_type']) => {
        switch (suggestion_type) {
            case 'product':
                return 'text-blue-600 bg-blue-50';
            case 'category':
                return 'text-green-600 bg-green-50';
            case 'color':
                return 'text-purple-600 bg-purple-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };
  
    return (
    <div className={`relative ${className}`} ref={inputRef}>
        {/* Search Input */}
        <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-300 ${glassStyles} ${
        isFocused ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
        }`}>
            <Search className="absolute left-4 w-5 h-5 text-gray-400" />
            <Input
            type="text"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setIsSuggestionsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder="Search products, categories, colors..."
            className="flex-1 pl-12 pr-12 py-6 border-0 bg-transparent text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"/>
            {query && (
                <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-2 w-8 h-8 rounded-full hover:bg-gray-100"
                >
                    <Delete className="w-4 h-4" />
                </Button>
            )}
        </div>
        {/* Suggestions Dropdown */}
        {isSuggestionsOpen && query.length >= 2 && (
            <Card className="absolute top-full left-0 right-0 mt-2 border-0 shadow-xl z-50 max-h-96 overflow-hidden">
                <CardContent className="p-0">
                    {/* Loading State */}
                    {suggestionsLoading ? (
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : suggestions.length > 0 ? (
                    <div className="py-2">
                        {/* Recent Searches Header */}
                        <div className="px-4 py-2 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                <Clock className="w-4 h-4" />
                                Search Suggestions
                            </div>
                        </div>
                        {/* Suggestions List */}
                        {suggestions.map((suggestion: SuggestionItem, index: number) => (
                            <Button
                            key={index}
                            variant="ghost"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full justify-start px-4 py-3 h-auto rounded-none hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`p-2 rounded-full ${getSuggestionColor(suggestion.suggestion_type)}`}>
                                        {getSuggestionIcon(suggestion.suggestion_type)}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-gray-900">{suggestion.value}</div>
                                        {suggestion.metadata?.category && (
                                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                                in <Badge variant="secondary" className="text-xs">{suggestion.metadata.category}</Badge>
                                            </div>
                                        )}
                                        {suggestion.suggestion_type === 'color' && suggestion.metadata?.product_count && (
                                            <div className="text-sm text-gray-500">
                                                {suggestion.metadata.product_count} product{suggestion.metadata.product_count !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                    <Badge 
                                    variant="outline" 
                                    className={`
                                        text-xs capitalize
                                        ${suggestion.suggestion_type === 'product' ? 'border-blue-200 text-blue-700' : ''}
                                        ${suggestion.suggestion_type === 'category' ? 'border-green-200 text-green-700' : ''}
                                        ${suggestion.suggestion_type === 'color' ? 'border-purple-200 text-purple-700' : ''}
                                        `}
                                    >
                                        {suggestion.suggestion_type}
                                    </Badge>
                                </div>
                            </Button>
                        ))}
                        {/* Search All Button */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                            <Button
                            onClick={() => handleSearch()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Search for &quot;{query}&quot;
                            </Button>
                        </div>
                    </div>
                ) : query.length >= 2 && !suggestionsLoading ? (
                <div className="p-6 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-gray-500 font-medium mb-1">No results found</div>
                    <div className="text-sm text-gray-400">
                        Try different keywords or browse categories
                    </div>
                </div>
            ) : null}
            </CardContent>
            </Card>
        )}
        </div>
    );
};