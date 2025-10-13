// @/lib/validation.ts
export const validatePhoneNumber = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
};

export const formatPhoneNumber = (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phoneNumber;
};

export const cleanPhoneNumber = (phoneNumber: string): string => {
    return phoneNumber.replace(/\D/g, '');
};

export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
    if (username.length < 3) {
        return { isValid: false, error: 'Username must be at least 3 characters long' };
    }
    
    if (username.length > 30) {
        return { isValid: false, error: 'Username must be less than 30 characters' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    
    return { isValid: true };
};