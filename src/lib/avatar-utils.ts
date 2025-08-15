/**
 * Avatar utility functions for the enhanced two-tier avatar system
 * 
 * System hierarchy:
 * 1. User uploaded image (from avatar_url)
 * 2. Dicebear generated avatar (based on email)
 * 3. Email fallback (first letter of email)
 * 4. Name fallback (initials from first/last name)
 * 5. Default fallback ("U")
 */

export interface AvatarData {
  // User uploaded image
  avatar_url?: string | null;
  
  // For Dicebear generation and email fallback
  email?: string | null;
  
  // For name-based fallback
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null; // Alternative full name field
  
  // Display name for alt text
  display_name?: string | null;
}

/**
 * Generate Dicebear avatar URL using avataaars style
 */
export function generateDicebearUrl(seed: string): string {
  if (!seed) return '';
  
  // Use avataaars style as specified in requirements
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Get email-based fallback (first letter of email, uppercase)
 */
export function getEmailFallback(email?: string | null): string {
  if (!email) return '';
  return email.charAt(0).toUpperCase();
}

/**
 * Get name-based fallback (initials from first and last name)
 */
export function getNameFallback(firstName?: string | null, lastName?: string | null, fullName?: string | null): string {
  // Try first_name + last_name approach first
  if (firstName || lastName) {
    const firstInitial = firstName?.charAt(0) || '';
    const lastInitial = lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }
  
  // Fallback to parsing full name
  if (fullName) {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    } else if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
  }
  
  return '';
}

/**
 * Get the best available fallback text for AvatarFallback component
 */
export function getAvatarFallback(data: AvatarData): string {
  // 1. Try email-based fallback first (as per requirements)
  const emailFallback = getEmailFallback(data.email);
  if (emailFallback) return emailFallback;
  
  // 2. Try name-based fallback
  const nameFallback = getNameFallback(data.first_name, data.last_name, data.name);
  if (nameFallback) return nameFallback;
  
  // 3. Default fallback
  return 'U';
}

/**
 * Get display name for alt text
 */
export function getDisplayName(data: AvatarData): string {
  if (data.display_name) return data.display_name;
  
  if (data.first_name && data.last_name) {
    return `${data.first_name} ${data.last_name}`;
  }
  
  if (data.name) return data.name;
  if (data.email) return data.email;
  
  return 'User';
}

/**
 * Get all avatar sources in priority order for the enhanced avatar system
 */
export function getAvatarSources(data: AvatarData) {
  return {
    // Primary sources (in order of preference)
    uploadedImage: data.avatar_url || null,
    dicebearUrl: data.email ? generateDicebearUrl(data.email) : null,
    
    // Fallback data
    fallbackText: getAvatarFallback(data),
    displayName: getDisplayName(data),
  };
}

/**
 * Enhanced avatar fallback styling based on content type
 */
export function getAvatarFallbackStyling(fallbackText: string, isEmailBased?: boolean) {
  // Email-based fallbacks get different styling than name-based
  if (isEmailBased || (fallbackText.length === 1 && fallbackText !== 'U')) {
    return 'bg-blue-100 text-blue-800 text-sm font-semibold';
  }
  
  // Name-based (initials) fallbacks
  if (fallbackText.length === 2) {
    return 'bg-purple-100 text-purple-800 text-sm font-medium';
  }
  
  // Default fallback
  return 'bg-gray-100 text-gray-800 text-sm font-medium';
}
