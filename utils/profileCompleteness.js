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

export const isPayoutAccountIncomplete = (user) => {
    if (!user) return false;

    const requiresPayoutAccount = Boolean(
        user.is_tourist || (user.is_local_guide && user.guide_approved)
    );
    if (!requiresPayoutAccount) return false;

    return (
        isBlank(user.payout_account_type)
        || isBlank(user.payout_account_name)
        || isBlank(user.payout_account_number)
    );
};

// Backward-compatible alias for existing imports.
export const isGuidePayoutIncomplete = isPayoutAccountIncomplete;

export const hasProfileAttentionDot = (user) => {
    if (!user) return false;
    return isCoreProfileIncomplete(user) || isPayoutAccountIncomplete(user);
};
