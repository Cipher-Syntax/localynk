const isBlank = (value) => {
    return !value || String(value).trim() === '';
};

export const isCoreProfileIncomplete = (user) => {
    if (!user) return false;

    return (
        isBlank(user.first_name)
        || isBlank(user.last_name)
        || isBlank(user.phone_number)
        || isBlank(user.location)
    );
};
