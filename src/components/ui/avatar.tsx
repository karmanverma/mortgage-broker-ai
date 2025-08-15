import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import { getAvatarSources, getAvatarFallbackStyling, type AvatarData } from "@/lib/avatar-utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

interface EnhancedAvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  data: AvatarData;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHoverEffect?: boolean;
  priority?: 'upload' | 'dicebear' | 'fallback'; // Override default priority
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-xs', 
  lg: 'text-sm',
  xl: 'text-base'
};

/**
 * Enhanced Avatar component implementing the two-tier avatar system:
 * 1. Primary: User uploaded image → Dicebear generated avatar
 * 2. Fallback: Email-based (first letter) → Name-based (initials) → Default 'U'
 */
const EnhancedAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  EnhancedAvatarProps
>(({ 
  className, 
  data, 
  size = 'lg', 
  showHoverEffect = false,
  priority,
  ...props 
}, ref) => {
  const sources = getAvatarSources(data);
  
  // Determine which images to try based on priority override
  const imageSources = React.useMemo(() => {
    const sources_list = [];
    
    if (priority === 'fallback') {
      // Skip all images, go straight to fallback
      return [];
    }
    
    if (priority === 'dicebear') {
      // Skip user upload, only try Dicebear
      if (sources.dicebearUrl) sources_list.push(sources.dicebearUrl);
    } else {
      // Default: try upload first, then Dicebear
      if (sources.uploadedImage) sources_list.push(sources.uploadedImage);
      if (sources.dicebearUrl) sources_list.push(sources.dicebearUrl);
    }
    
    return sources_list;
  }, [sources, priority]);

  // Determine if fallback is email-based for styling
  const isEmailBased = data.email && sources.fallbackText === data.email.charAt(0).toUpperCase();
  const fallbackStyling = getAvatarFallbackStyling(sources.fallbackText, isEmailBased);

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        showHoverEffect && "cursor-pointer transition-transform hover:scale-105",
        className
      )}
      {...props}
    >
      {/* Try each image source in order */}
      {imageSources.map((src, index) => (
        <AvatarPrimitive.Image
          key={index}
          src={src}
          alt={sources.displayName}
          className="aspect-square h-full w-full object-cover"
        />
      ))}
      
      {/* Fallback with enhanced styling */}
      <AvatarPrimitive.Fallback
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full font-medium",
          fallbackStyling,
          textSizeClasses[size]
        )}
      >
        {sources.fallbackText}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
})
EnhancedAvatar.displayName = "EnhancedAvatar"

export { Avatar, AvatarImage, AvatarFallback, EnhancedAvatar }
