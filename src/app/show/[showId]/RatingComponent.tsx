'use client'

import { useState, useEffect, useRef } from 'react'
import { FaStar, FaRegStar, FaStarHalfAlt, FaTimes } from 'react-icons/fa'

type RatingComponentProps = {
  entityType: 'show' | 'season' | 'episode'
  entityId: number
  onRatingChange?: (newRating: number) => void
}

export default function RatingComponent({ 
  entityType,
  entityId,
  onRatingChange
}: RatingComponentProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const starsContainerRef = useRef<HTMLDivElement>(null)

  // Fetch rating
  useEffect(() => {
    const fetchRating = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/ratings?${entityType}Id=${entityId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch rating: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        const fetchedRating = 
          entityType === 'show' ? data.showRating :
          entityType === 'season' ? data.seasonRating :
          data.episodeRating
        
        setRating(fetchedRating || 0)
      } catch (err) {
        console.error('Rating fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load rating')
        setRating(0)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRating()
  }, [entityType, entityId])

  const handleRating = async (newRating: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          [`${entityType}Id`]: entityId,
          rating: newRating 
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to submit rating: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setRating(data.rating)
      if (onRatingChange) {
        onRatingChange(data.rating)
      }
    } catch (err) {
      console.error('Rating submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveRating = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/ratings?${entityType}Id=${entityId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to remove rating: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setRating(0)
      setHoverRating(0)
      if (onRatingChange) {
        onRatingChange(0)
      }
    } catch (err) {
      console.error('Rating removal error:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove rating')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStarHover = (star: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    
    setHoverRating(percent < 0.5 ? star - 0.5 : star);
  };

  const handleStarClick = (star: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    
    const newRating = percent < 0.5 ? star - 0.5 : star;
    handleRating(newRating);
  };

  // Touch handlers for mobile
  const handleTouchStart = () => {
    if (isLoading) return;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !starsContainerRef.current) return;
    
    const containerRect = starsContainerRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - containerRect.left;
    const containerWidth = containerRect.width;
    const percentage = Math.min(Math.max(touchX / containerWidth, 0), 1);
    
    const rawRating = percentage * 5;
    const roundedRating = Math.round(rawRating * 2) / 2; // Round to nearest 0.5
    
    setHoverRating(roundedRating);
  };

  const handleTouchEnd = () => {
    if (isDragging && hoverRating > 0) {
      handleRating(hoverRating);
    }
    setIsDragging(false);
    setHoverRating(0);
  };

  const renderStar = (star: number) => {
    const currentRating = isDragging ? hoverRating : (hoverRating || rating);
    
    if (currentRating >= star) {
      return <FaStar className="text-yellow-400" />;
    }
    
    if (currentRating >= star - 0.5) {
      return <FaStarHalfAlt className="text-yellow-400" />;
    }
    
    return <FaRegStar className="text-gray-400" />;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* Stars rating */}
        <div 
          ref={starsContainerRef}
          className="flex items-center gap-1"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={(e) => !isLoading && handleStarHover(star, e)}
              onMouseMove={(e) => !isLoading && handleStarHover(star, e)}
              onMouseLeave={() => !isLoading && setHoverRating(0)}
              onClick={(e) => !isLoading && handleStarClick(star, e)}
              className={`text-xl focus:outline-none relative ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 transition-transform'
              }`}
              aria-label={`Rate ${star} out of 5`}
              disabled={isLoading}
            >
              {renderStar(star)}
            </button>
          ))}
        </div>
        
        {/* Remove rating button */}
        {rating > 0 && (
          <button
            onClick={handleRemoveRating}
            disabled={isLoading}
            className={`text-gray-200 hover:text-red-700 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Remove rating"
          >
            <FaTimes />
          </button>
        )}
      </div>
      
      {/* Loading and error states */}
      {isLoading && (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        </div>
      )}
      
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}