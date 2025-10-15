'use client';

import { useSearchSuggestions, type SuggestionItem } from '@/hooks/useSearch';
import { ArrowLeft, Clock, Delete, Palette, Search, Tag, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Shadcn UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ 
  isOpen, 
  onClose, 
  initialQuery = '' 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { data: suggestionsData, isLoading: suggestionsLoading } = useSearchSuggestions(query);
  const suggestions = suggestionsData?.suggestions || [];

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setIsSuggestionsOpen(false);
    }
  }, [isOpen]);

  const handleSearch = (searchQuery: string = query) => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      onClose();
    }
  };

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    // Updated to use suggestion_type and handle product navigation
    switch (suggestion.suggestion_type) {
      case 'product':
        // For product suggestions, navigate directly to the product page if we have the slug
        if (suggestion.metadata?.slug) {
          router.push(`/products/${suggestion.metadata.slug}`);
          onClose();
          return;
        } else {
          router.push(`/search?q=${encodeURIComponent(suggestion.value)}`);
          onClose();
        }
        break;
      case 'category':
        router.push(`/search?categories=${suggestion.metadata?.id || ''}`);
        onClose();
        break;
      case 'color':
        router.push(`/search?colors=${encodeURIComponent(suggestion.value)}`);
        onClose();
        break;
      default:
        router.push(`/search?q=${encodeURIComponent(suggestion.value)}`);
        onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-20">
      {/* Modal Container with Glass Effect */}
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-in fade-in-90 slide-in-from-top-5 duration-300">
        
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full w-10 h-10 hover:bg-white/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSuggestionsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSuggestionsOpen(true)}
              placeholder="What are you looking for?"
              className="pl-12 pr-12 py-6 border-0 bg-white/80 backdrop-blur-sm text-lg placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100"
              >
                <Delete className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100"          >
              <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Suggestions Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length >= 2 ? (
            <>
              {/* Loading State */}
              {suggestionsLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  {/* Suggestions Header */}
                  <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
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
                      className="w-full justify-start px-6 py-4 h-auto rounded-none hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className={`p-2 rounded-full ${getSuggestionColor(suggestion.suggestion_type)}`}>
                          {getSuggestionIcon(suggestion.suggestion_type)}
                        </div>
                        
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 text-base">{suggestion.value}</div>
                          
                          {suggestion.metadata?.category && (
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              in <Badge variant="secondary" className="text-xs">{suggestion.metadata.category}</Badge>
                            </div>
                          )}
                          
                          {suggestion.suggestion_type === 'color' && suggestion.metadata?.product_count && (
                            <div className="text-sm text-gray-500 mt-1">
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
                  <div className="p-4 border-t border-gray-100 bg-white/80">
                    <Button
                      onClick={() => handleSearch()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-medium rounded-xl"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search for &quot;{query}&quot;
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-gray-600 font-medium text-lg mb-2">No results found</div>
                  <div className="text-gray-400 text-sm">
                    Try different keywords or browse our categories
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State - Popular Searches */
            <div className="p-6">
              <div className="text-sm font-medium text-gray-500 mb-4">Popular Searches</div>
              <div className="flex flex-wrap gap-2">
                {['Dresses', 'Tops', 'Jeans', 'Skirts', 'Accessories'].map((term) => (
                  <Badge
                    key={term}
                    variant="secondary"
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      setQuery(term);
                      setIsSuggestionsOpen(true);
                    }}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};