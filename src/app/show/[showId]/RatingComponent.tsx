'use client'

import { useState, useEffect } from 'react'
import { FaStar, FaRegStar } from 'react-icons/fa'

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
        
        // Get the correct rating based on entity type
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

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => !isLoading && setHoverRating(star)}
            onMouseLeave={() => !isLoading && setHoverRating(0)}
            onClick={() => !isLoading && handleRating(star)}
            className={`text-xl focus:outline-none ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 transition-transform'
            }`}
            aria-label={`Rate ${star} out of 5`}
            disabled={isLoading}
          >
            {(hoverRating || rating) >= star ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <FaRegStar className="text-gray-400" />
            )}
          </button>
        ))}
      </div>
      
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