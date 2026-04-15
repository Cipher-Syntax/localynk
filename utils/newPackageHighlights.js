import api from '../api/api';

const DEFAULT_LIMIT_PER_DESTINATION = 3;

const parseDestinationId = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeDestinationIds = (values = []) => {
    const source = Array.isArray(values) ? values : [values];
    const ids = [];
    const seen = new Set();

    source.forEach((value) => {
        if (value === null || value === undefined) return;

        String(value)
            .split(',')
            .map((item) => parseDestinationId(item))
            .filter(Boolean)
            .forEach((id) => {
                const key = String(id);
                if (seen.has(key)) return;
                seen.add(key);
                ids.push(id);
            });
    });

    return ids;
};

const normalizePackages = (packages = []) => {
    if (!Array.isArray(packages)) return [];

    return packages
        .map((item) => {
            const packageId = parseDestinationId(item?.id);
            if (!packageId) return null;

            return {
                id: packageId,
                name: String(item?.name || '').trim() || 'New Package',
                duration_days: Number.parseInt(item?.duration_days, 10) || 1,
                created_at: item?.created_at || null,
                owner_type: item?.owner_type || 'guide',
                owner_name: String(item?.owner_name || '').trim() || 'Local Provider',
                guide_id: parseDestinationId(item?.guide_id),
                agency_user_id: parseDestinationId(item?.agency_user_id),
                destination_id: parseDestinationId(item?.destination_id),
                destination_name: String(item?.destination_name || '').trim(),
            };
        })
        .filter(Boolean);
};

export const buildDestinationHighlightsMap = (payload) => {
    const destinations = Array.isArray(payload?.destinations) ? payload.destinations : [];
    const rawCounts = payload?.destination_counts || {};

    const byDestinationId = {};
    const countsByDestinationId = {};

    Object.entries(rawCounts).forEach(([key, value]) => {
        const parsedId = parseDestinationId(key);
        const count = Number.parseInt(value, 10) || 0;
        if (!parsedId) return;
        countsByDestinationId[String(parsedId)] = count;
    });

    destinations.forEach((entry) => {
        const destinationId = parseDestinationId(entry?.destination_id);
        if (!destinationId) return;

        const normalizedPackages = normalizePackages(entry?.packages || []);
        const count = Number.parseInt(entry?.new_packages_count, 10) || normalizedPackages.length;
        const key = String(destinationId);

        countsByDestinationId[key] = Math.max(countsByDestinationId[key] || 0, count);

        byDestinationId[key] = {
            destination_id: destinationId,
            destination_name: String(entry?.destination_name || '').trim(),
            new_packages_count: count,
            packages: normalizedPackages,
        };
    });

    return {
        targetDate: payload?.target_date || null,
        timezone: payload?.timezone || 'Asia/Manila',
        perDestinationLimit: Number.parseInt(payload?.per_destination_limit, 10) || DEFAULT_LIMIT_PER_DESTINATION,
        countsByDestinationId,
        byDestinationId,
    };
};

export const fetchDestinationHighlights = async ({
    destinationIds = [],
    destinationId = null,
    limitPerDestination = DEFAULT_LIMIT_PER_DESTINATION,
} = {}) => {
    const params = {
        limit_per_destination: Number.parseInt(limitPerDestination, 10) || DEFAULT_LIMIT_PER_DESTINATION,
    };

    const normalizedDestinationIds = normalizeDestinationIds(destinationIds);
    const normalizedSingleDestinationId = parseDestinationId(destinationId);

    if (normalizedDestinationIds.length > 0) {
        params.destination_ids = normalizedDestinationIds.join(',');
    }

    if (normalizedSingleDestinationId) {
        params.destination_id = normalizedSingleDestinationId;
    }

    const response = await api.get('/api/destinations/new-package-highlights/', { params });
    return buildDestinationHighlightsMap(response.data || {});
};

export const formatHighlightDateLabel = (targetDate) => {
    if (!targetDate) return 'yesterday';

    const parsedDate = new Date(`${targetDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) return targetDate;

    return parsedDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
};
