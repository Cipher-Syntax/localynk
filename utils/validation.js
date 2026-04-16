export const NAME_REGEX = /^[a-zA-ZñÑ\s\-]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_OF_BIRTH_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MINIMUM_APP_AGE = 18;

export const NAME_ERROR_MESSAGE = 'Please provide a valid name. Only letters, spaces, and hyphens (-) are allowed. Numbers and special characters are not permitted.';
export const EMAIL_ERROR_MESSAGE = 'Please provide a valid email address (e.g., name@example.com).';
export const PHONE_ERROR_MESSAGE = 'Please provide a valid phone number.';
export const BIRTHDATE_ERROR_MESSAGE = 'Use YYYY-MM-DD format and make sure you are at least 18 years old.';

export const isValidName = (value = '') => {
    const trimmed = String(value || '').trim();
    return !!trimmed && NAME_REGEX.test(trimmed);
};

export const isValidEmail = (value = '') => {
    const trimmed = String(value || '').trim();
    return !!trimmed && EMAIL_REGEX.test(trimmed);
};

export const parseYyyyMmDdToLocalDate = (value = '') => {
    const trimmed = String(value || '').trim();
    if (!DATE_OF_BIRTH_REGEX.test(trimmed)) return null;

    const [yearText, monthText, dayText] = trimmed.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    const parsed = new Date(year, month - 1, day);
    if (
        Number.isNaN(parsed.getTime())
        || parsed.getFullYear() !== year
        || parsed.getMonth() !== month - 1
        || parsed.getDate() !== day
    ) {
        return null;
    }

    return parsed;
};

export const formatDateAsYyyyMmDd = (value) => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const parseDateOnly = (value = '') => {
    const trimmed = String(value || '').trim();
    if (!DATE_OF_BIRTH_REGEX.test(trimmed)) return null;

    const [yearText, monthText, dayText] = trimmed.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
        Number.isNaN(parsed.getTime())
        || parsed.getUTCFullYear() !== year
        || parsed.getUTCMonth() !== month - 1
        || parsed.getUTCDate() !== day
    ) {
        return null;
    }

    return parsed;
};

export const getAgeFromDateOfBirth = (value = '') => {
    const birthDate = parseDateOnly(value);
    if (!birthDate) return null;

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const currentDay = now.getUTCDate();

    let age = currentYear - birthDate.getUTCFullYear();
    if (
        currentMonth < birthDate.getUTCMonth()
        || (currentMonth === birthDate.getUTCMonth() && currentDay < birthDate.getUTCDate())
    ) {
        age -= 1;
    }

    return age;
};

export const validateAdultBirthDate = (value = '', { required = true } = {}) => {
    const trimmed = String(value || '').trim();

    if (!trimmed) {
        return required ? 'Birthdate is required.' : true;
    }

    const birthDate = parseDateOnly(trimmed);
    if (!birthDate) {
        return 'Birthdate must use YYYY-MM-DD format.';
    }

    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (birthDate > todayUtc) {
        return 'Birthdate cannot be in the future.';
    }

    const age = getAgeFromDateOfBirth(trimmed);
    if (age === null || age < MINIMUM_APP_AGE) {
        return `You must be at least ${MINIMUM_APP_AGE} years old.`;
    }

    return true;
};
