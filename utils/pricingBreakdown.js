const toNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const hasValue = (value) => Number.isFinite(value) && Math.abs(value) > 0.0001;

const inferItineraryDays = (timelineRaw) => {
    let timeline = timelineRaw;

    if (typeof timeline === 'string') {
        try {
            timeline = JSON.parse(timeline);
        } catch (error) {
            timeline = [];
        }
    }

    if (!Array.isArray(timeline) || timeline.length === 0) {
        return 0;
    }

    return timeline.reduce((maxDay, entry) => {
        const parsedDay = Math.round(toNumber(entry?.day));
        return parsedDay > maxDay ? parsedDay : maxDay;
    }, 0);
};

const deriveDuration = ({ startDate, endDate, explicitDays }) => {
    const parsedExplicitDays = Math.round(toNumber(explicitDays));

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        const fallbackDays = parsedExplicitDays > 0 ? parsedExplicitDays : 1;
        return {
            days: fallbackDays,
            nights: fallbackDays > 1 ? fallbackDays - 1 : 1,
        };
    }

    const oneDay = 24 * 60 * 60 * 1000;
    const dateSpanDays = Math.max(Math.round((end - start) / oneDay) + 1, 1);
    const finalDays = Math.max(dateSpanDays, parsedExplicitDays > 0 ? parsedExplicitDays : 1);

    return {
        days: finalDays,
        nights: finalDays > 1 ? finalDays - 1 : 1,
    };
};

export const buildPricingBreakdown = (input = {}) => {
    const packageDetail = input.packageDetail || {};
    const accommodationDetail = input.accommodationDetail || {};
    const recordedTotal = toNumber(input.totalPrice);

    const itineraryDays = inferItineraryDays(
        input.itineraryTimeline ?? packageDetail.itinerary_timeline
    );
    const explicitDuration = Math.max(
        Math.round(toNumber(input.packageDurationDays || packageDetail.duration_days)),
        itineraryDays
    );

    const { days, nights } = deriveDuration({
        startDate: input.startDate,
        endDate: input.endDate,
        explicitDays: explicitDuration,
    });

    const guestsRaw = toNumber(
        input.numberOfPeople ?? input.numGuests ?? input.num_guests
    );
    const guests = Math.max(1, Math.round(guestsRaw || 1));

    const groupTypeRaw = String(input.groupType || '').toLowerCase();
    const isGroup = groupTypeRaw ? groupTypeRaw === 'group' : guests > 1;

    const soloRate = toNumber(input.soloPricePerDay ?? packageDetail.solo_price);
    const groupRate = toNumber(input.groupPricePerDay ?? packageDetail.price_per_day);

    let packageRatePerDay = toNumber(input.tourCostPerDay);
    if (!hasValue(packageRatePerDay)) {
        packageRatePerDay = isGroup ? groupRate : soloRate;
    }
    if (!hasValue(packageRatePerDay)) {
        packageRatePerDay = soloRate || groupRate;
    }

    const extraFeePerHead = toNumber(
        input.extraPersonFeePerHead ?? packageDetail.additional_fee_per_head
    );
    const extraGuests = isGroup ? Math.max(guests - 1, 0) : 0;

    let packageSubtotal = packageRatePerDay * days;
    const extraGuestSubtotal = extraGuests * extraFeePerHead * days;

    const accommodationRatePerNight = toNumber(
        input.accommodationCostPerNight ?? input.accommodationRate ?? accommodationDetail.price
    );
    const accommodationSubtotal = accommodationRatePerNight * nights;

    if (!hasValue(packageSubtotal) && hasValue(recordedTotal)) {
        const inferredPackageSubtotal = Math.max(
            recordedTotal - (extraGuestSubtotal + accommodationSubtotal),
            0
        );

        if (hasValue(inferredPackageSubtotal)) {
            packageSubtotal = inferredPackageSubtotal;
            packageRatePerDay = days > 0 ? inferredPackageSubtotal / days : inferredPackageSubtotal;
        }
    }

    const computedSubtotal = packageSubtotal + extraGuestSubtotal + accommodationSubtotal;
    const totalPrice = hasValue(recordedTotal) ? recordedTotal : computedSubtotal;

    const adjustmentRaw = totalPrice - computedSubtotal;
    const hasAdjustment = hasValue(adjustmentRaw);

    return {
        days,
        nights,
        guests,
        isGroup,
        extraGuests,
        packageRatePerDay,
        extraFeePerHead,
        accommodationRatePerNight,
        packageSubtotal,
        extraGuestSubtotal,
        accommodationSubtotal,
        computedSubtotal,
        totalPrice,
        adjustmentAmount: hasAdjustment ? adjustmentRaw : 0,
        hasAdjustment,
        hasBreakdownItems:
            hasValue(packageSubtotal) ||
            hasValue(extraGuestSubtotal) ||
            hasValue(accommodationSubtotal),
    };
};
