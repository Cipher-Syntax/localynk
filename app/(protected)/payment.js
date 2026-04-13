import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User, AlertCircle, CheckCircle2, UploadCloud, Calendar as CalendarIcon, Bed, Star } from 'lucide-react-native'; 
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import PaymentReviewModal from '../../components/payment/paymentReviewModal';
import StopDetailsModal from '../../components/itinerary/StopDetailsModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { formatPHPhoneLocal, normalizePHPhone } from '../../utils/phoneNumber';
import { NAME_REGEX, NAME_ERROR_MESSAGE, PHONE_ERROR_MESSAGE } from '../../utils/validation';
import { buildPricingBreakdown } from '../../utils/pricingBreakdown';
import ScreenSafeArea from '../../components/ScreenSafeArea';

const PRIMARY_COLOR = '#0072FF';
const SURFACE_COLOR = '#FFFFFF';
const BACKGROUND_COLOR = '#F8F9FC';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const Payment = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const {
        entityName, guideName, placeName, bookingId, entityId, guideId, bookingType,
        agencyId,
        basePrice, soloPrice, accommodationPrice, accommodationId,
        accommodationName, additionalFee, placeId, tourPackageId, itineraryTimeline, packageDuration: paramPackageDuration,
        agencyDownPayment, agencyLogo, guideProfilePicture,
        agencyAvailableDays, agencyOpeningTime, agencyClosingTime
    } = params;

    const [fetchedBooking, setFetchedBooking] = useState(null);
    const [loadingBooking, setLoadingBooking] = useState(!!bookingId);

    const [guideAvailability, setGuideAvailability] = useState(null);
    const [blockedDates, setBlockedDates] = useState([]); 
    
    const [guidePackages, setGuidePackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [accommodationOptions, setAccommodationOptions] = useState([]);
    const [selectedAccommodation, setSelectedAccommodation] = useState(null);
    const [accommodationInitialized, setAccommodationInitialized] = useState(false);

    const getPackageDurationDays = (pkg) => {
        if (!pkg) return 1;
        const raw = parseInt(pkg.duration_days);
        let inferred = Number.isFinite(raw) && raw > 0 ? raw : 0;

        let timeline = [];
        try {
            timeline = typeof pkg.itinerary_timeline === 'string'
                ? JSON.parse(pkg.itinerary_timeline)
                : (pkg.itinerary_timeline || []);
        } catch (_e) {
            timeline = [];
        }

        if (Array.isArray(timeline) && timeline.length > 0) {
            const maxDay = timeline.reduce((max, item) => {
                const dayNum = parseInt(item?.day);
                return Number.isFinite(dayNum) && dayNum > max ? dayNum : max;
            }, 1);
            inferred = Math.max(inferred, maxDay);
        }

        return inferred > 0 ? inferred : 1;
    };

    const normalizeScheduleDay = useCallback((day) => {
        if (!day) return null;
        const raw = String(day).trim().toLowerCase();
        if (raw === 'all' || raw === 'daily' || raw === 'everyday') return 'All';
        const map = {
            monday: 'Mon', mon: 'Mon',
            tuesday: 'Tue', tue: 'Tue', tues: 'Tue',
            wednesday: 'Wed', wed: 'Wed',
            thursday: 'Thu', thu: 'Thu', thurs: 'Thu',
            friday: 'Fri', fri: 'Fri',
            saturday: 'Sat', sat: 'Sat',
            sunday: 'Sun', sun: 'Sun',
        };
        return map[raw] || null;
    }, []);

    const formatScheduleDaysLabel = React.useCallback((days, isAgencySchedule = false) => {
        if (!Array.isArray(days) || days.length === 0) {
            return isAgencySchedule ? 'Daily' : 'Not set';
        }

        const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const normalized = new Set(days.map(normalizeScheduleDay).filter(Boolean));

        if (normalized.has('All')) return 'Daily';

        const ordered = orderedDays.filter((day) => normalized.has(day));
        if (ordered.length === 0) return isAgencySchedule ? 'Daily' : 'Not set';

        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        if (weekdays.every((day) => normalized.has(day)) && ordered.length === weekdays.length) {
            return 'Mon - Fri';
        }

        if (ordered.length === orderedDays.length) return 'Daily';
        return ordered.join(', ');
    }, [normalizeScheduleDay]);

    const formatTimeLabel = (timeStr) => {
        if (!timeStr) return null;
        const [hourRaw, minuteRaw] = String(timeStr).split(':');
        const hour = Number.parseInt(hourRaw, 10);
        const minute = Number.parseInt(minuteRaw, 10);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
        const period = hour >= 12 ? 'PM' : 'AM';
        const twelveHour = hour % 12 || 12;
        return `${twelveHour}:${String(minute).padStart(2, '0')} ${period}`;
    };

    const [concurrentBookings, setConcurrentBookings] = useState([]);
    const [loadingConcurrent, setLoadingConcurrent] = useState(false);
    
    const [manifestModalVisible, setManifestModalVisible] = useState(false);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) return;
            try {
                const response = await api.get(`/api/bookings/${bookingId}/`);
                setFetchedBooking(response.data);
            } catch (error) { console.error("Failed to fetch booking details:", error); } 
            finally { setLoadingBooking(false); }
        };
        fetchBookingDetails();
    }, [bookingId]);

    const currentStatus = fetchedBooking?.status || 'Pending_Payment';
    const isConfirmed = currentStatus === 'Confirmed' || currentStatus === 'Completed';
    const isPayable = bookingId && (currentStatus === 'Accepted' || currentStatus === 'Pending_Payment');
    const isRequestMode = !bookingId;

    const isAgency = bookingType === 'agency';
    const isAgencyRequestMode = isAgency && !bookingId;
    const resolvedName =
        fetchedBooking?.guide_detail?.full_name ||
        `${fetchedBooking?.guide_detail?.first_name || ''} ${fetchedBooking?.guide_detail?.last_name || ''}`.trim() ||
        fetchedBooking?.guide_detail?.username ||
        fetchedBooking?.agency_detail?.business_name ||
        fetchedBooking?.agency_detail?.full_name ||
        fetchedBooking?.agency_detail?.username ||
        entityName ||
        guideName ||
        (isAgency ? "Selected Agency" : "Selected Guide");
    const resolvedId = fetchedBooking?.guide || fetchedBooking?.agency || entityId || guideId;
    const selectedDestinationId = useMemo(() => {
        const rawId = fetchedBooking?.destination || fetchedBooking?.destination_detail?.id || placeId;
        const parsed = Number(rawId);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [fetchedBooking, placeId]);

    const selectedDestinationName = useMemo(() => {
        const rawName = fetchedBooking?.destination_detail?.name || placeName || '';
        return String(rawName).trim().toLowerCase();
    }, [fetchedBooking, placeName]);

    const selectedAgencyProfileId = useMemo(() => {
        const rawId = agencyId || fetchedBooking?.accommodation_detail?.agency_id;
        const parsed = Number(rawId);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [agencyId, fetchedBooking]);

    const initialAgencyAvailability = useMemo(() => {
        let parsedDays = [];
        if (Array.isArray(agencyAvailableDays)) {
            parsedDays = agencyAvailableDays;
        } else if (typeof agencyAvailableDays === 'string' && agencyAvailableDays.trim()) {
            try {
                const parsed = JSON.parse(agencyAvailableDays);
                if (Array.isArray(parsed)) parsedDays = parsed;
            } catch {
                parsedDays = [];
            }
        }

        return {
            available_days: parsedDays,
            specific_available_dates: [],
            opening_time: agencyOpeningTime || null,
            closing_time: agencyClosingTime || null,
        };
    }, [agencyAvailableDays, agencyOpeningTime, agencyClosingTime]);

    const operatingDaysLabel = useMemo(() => {
        return formatScheduleDaysLabel(guideAvailability?.available_days || [], isAgency);
    }, [guideAvailability, isAgency, formatScheduleDaysLabel]);

    const operatingHoursLabel = useMemo(() => {
        const open = formatTimeLabel(guideAvailability?.opening_time);
        const close = formatTimeLabel(guideAvailability?.closing_time);
        if (open && close) return `${open} - ${close}`;
        if (open) return `Opens ${open}`;
        if (close) return `Closes ${close}`;
        return isAgency ? 'Hours not set' : 'Not set';
    }, [guideAvailability, isAgency]);

    useEffect(() => {
        const fetchAvailabilityAndPackages = async () => {
            if (resolvedId) { 
                try {
                    const destinationIdForTours = selectedDestinationId || null;
                    const fetchAgencyAvailability = async () => {
                        try {
                            const agenciesRes = await api.get('/api/agencies/');
                            const agenciesData = Array.isArray(agenciesRes.data)
                                ? agenciesRes.data
                                : (agenciesRes.data?.results || []);

                            const normalizedResolvedId = Number(resolvedId);
                            const matchedAgency = agenciesData.find((agency) => {
                                const profileId = Number(agency?.id);
                                const userId = Number(agency?.user?.id ?? agency?.user ?? agency?.user_id);

                                if (selectedAgencyProfileId && profileId === Number(selectedAgencyProfileId)) {
                                    return true;
                                }

                                return normalizedResolvedId > 0 && (
                                    userId === normalizedResolvedId ||
                                    profileId === normalizedResolvedId
                                );
                            });

                            if (matchedAgency) {
                                return {
                                    data: {
                                        available_days: Array.isArray(matchedAgency.available_days)
                                            ? matchedAgency.available_days
                                            : (initialAgencyAvailability.available_days || []),
                                        specific_available_dates: [],
                                        opening_time: matchedAgency.opening_time || initialAgencyAvailability.opening_time || null,
                                        closing_time: matchedAgency.closing_time || initialAgencyAvailability.closing_time || null,
                                        logo: matchedAgency.logo || null,
                                        profile_picture: matchedAgency.profile_picture || null,
                                    },
                                };
                            }
                        } catch (error) {
                            console.log('Failed to fetch agency availability, using param fallback.', error?.message || error);
                        }

                        return {
                            data: {
                                available_days: initialAgencyAvailability.available_days?.length
                                    ? initialAgencyAvailability.available_days
                                    : ['All'],
                                specific_available_dates: [],
                                opening_time: initialAgencyAvailability.opening_time || null,
                                closing_time: initialAgencyAvailability.closing_time || null,
                            },
                        };
                    };

                    const availPromise = isAgency ? fetchAgencyAvailability() : api.get(`/api/guides/${resolvedId}/`);
                    const blockedPromise = isAgency ? Promise.resolve({ data: [] }) : api.get(`/api/bookings/guide_blocked_dates/`, { params: { guide_id: resolvedId } });
                    const toursPromise = destinationIdForTours ? api.get(`/api/destinations/${destinationIdForTours}/tours/`) : Promise.resolve({ data: [] });
                    const accomPromise = isAgency
                        ? (selectedAgencyProfileId
                            ? api.get('/api/accommodations/', { params: { agency_id: selectedAgencyProfileId } })
                            : api.get('/api/accommodations/'))
                        : api.get('/api/accommodations/', { params: { host_id: resolvedId } });

                    const [availRes, blockedRes, toursRes, accomRes] = await Promise.all([
                        availPromise, blockedPromise, toursPromise, accomPromise
                    ]);
                    
                    setGuideAvailability(availRes.data);
                    setBlockedDates(blockedRes.data || []);
                    
                    if (destinationIdForTours && toursRes.data) {
                        const toursData = Array.isArray(toursRes.data) ? toursRes.data : (toursRes.data?.results || []);
                        
                        const myTours = toursData.filter(t => {
                            if (isAgency) {
                                const aId = t.agency_user_id || t.agency?.id || t.agency?.user || t.agency;
                                return Number(aId) === Number(resolvedId);
                            } else {
                                const gId = t.guide?.id || t.guide?.user || t.guide;
                                return Number(gId) === Number(resolvedId);
                            }
                        });
                        
                        setGuidePackages(myTours);
                        if (myTours.length > 0) {
                            const preferredTourId = Number(
                                tourPackageId || fetchedBooking?.tour_package_detail?.id || fetchedBooking?.tour_package
                            );
                            const defaultTour = myTours.find(t => Number(t.id) === preferredTourId) || myTours[0];
                            setSelectedPackage(defaultTour);
                        }
                    }

                    const accomData = Array.isArray(accomRes.data) ? accomRes.data : (accomRes.data?.results || []);
                    
                    const normalizedResolvedId = Number(resolvedId);
                    const normalizedAgencyId = Number(selectedAgencyProfileId);

                    const myAccommodations = isAgency
                        ? accomData.filter(a => {
                            const agencyUser = Number(a.agency_user_id ?? a.agency?.user?.id ?? a.agency?.user ?? a.agency_user);
                            const agencyProfile = Number(a.agency_id ?? a.agency?.id ?? a.agency);
                            const hostOwner = Number(a.host_id ?? a.host?.id ?? a.host?.user ?? a.host);

                            const profileMatch = normalizedAgencyId > 0 && agencyProfile === normalizedAgencyId;
                            const userMatch = normalizedResolvedId > 0 && (
                                agencyUser === normalizedResolvedId ||
                                hostOwner === normalizedResolvedId ||
                                agencyProfile === normalizedResolvedId
                            );

                            return profileMatch || userMatch;
                        })
                        : accomData;

                    setAccommodationOptions(myAccommodations);

                    const preferredAccommodationId = Number(
                        accommodationId || fetchedBooking?.accommodation_detail?.id || fetchedBooking?.accommodation
                    );
                    const preselectedByParam = myAccommodations.find((a) => Number(a.id) === preferredAccommodationId);
                    setSelectedAccommodation(preselectedByParam || null);
                    setAccommodationInitialized(true);
                } catch (error) { 
                    console.error("Failed to fetch provider data:", error); 
                }
            }
        };
        fetchAvailabilityAndPackages();
    }, [resolvedId, isAgency, selectedDestinationId, tourPackageId, accommodationId, selectedAgencyProfileId, fetchedBooking, initialAgencyAvailability]);

    const bookingDurationFromFetched = useMemo(() => {
        const checkIn = fetchedBooking?.check_in;
        const checkOut = fetchedBooking?.check_out || fetchedBooking?.check_in;
        if (!checkIn || !checkOut) return 0;

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1, 1);
    }, [fetchedBooking]);

    const activeDuration = selectedPackage
        ? getPackageDurationDays(selectedPackage)
        : (parseInt(paramPackageDuration) || bookingDurationFromFetched || 1);
    const activeItinerary = selectedPackage
        ? selectedPackage.itinerary_timeline
        : (itineraryTimeline || fetchedBooking?.tour_package_detail?.itinerary_timeline || null);
    const tourCostGroup = selectedPackage ? parseFloat(selectedPackage.price_per_day) : (basePrice ? parseFloat(basePrice) : 500);
    const tourCostSolo = selectedPackage ? parseFloat(selectedPackage.solo_price) : (soloPrice ? parseFloat(soloPrice) : tourCostGroup);
    const extraPersonFee = selectedPackage ? parseFloat(selectedPackage.additional_fee_per_head || 0) : (additionalFee ? parseFloat(additionalFee) : 0);
    const fetchedAccommodationPrice = parseFloat(fetchedBooking?.accommodation_detail?.price || 0);
    const accomCost = accommodationInitialized
        ? (selectedAccommodation ? parseFloat(selectedAccommodation.price || 0) : fetchedAccommodationPrice)
        : (accommodationPrice ? parseFloat(accommodationPrice) : fetchedAccommodationPrice);
    
    const parsedItinerary = useMemo(() => {
        try { return activeItinerary ? (typeof activeItinerary === 'string' ? JSON.parse(activeItinerary) : activeItinerary) : []; } 
        catch (_e) { return []; }
    }, [activeItinerary]);

    const groupedItinerary = useMemo(() => {
        return parsedItinerary.reduce((acc, item) => {
            const d = parseInt(item.day) || 1;
            if (!acc[d]) acc[d] = [];
            acc[d].push(item);
            return acc;
        }, {});
    }, [parsedItinerary]);

    const itineraryStopCatalog = useMemo(() => {
        if (Array.isArray(selectedPackage?.stops)) return selectedPackage.stops;
        if (Array.isArray(fetchedBooking?.tour_package_detail?.stops)) return fetchedBooking.tour_package_detail.stops;
        return [];
    }, [selectedPackage, fetchedBooking]);

    const itineraryAccommodationCatalog = useMemo(() => {
        const catalog = Array.isArray(accommodationOptions) ? [...accommodationOptions] : [];

        if (selectedAccommodation && !catalog.some((item) => Number(item?.id) === Number(selectedAccommodation?.id))) {
            catalog.push(selectedAccommodation);
        }

        if (
            fetchedBooking?.accommodation_detail
            && !catalog.some((item) => Number(item?.id) === Number(fetchedBooking?.accommodation_detail?.id))
        ) {
            catalog.push(fetchedBooking.accommodation_detail);
        }

        return catalog;
    }, [accommodationOptions, selectedAccommodation, fetchedBooking]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stopDetailsVisible, setStopDetailsVisible] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [selectingType, setSelectingType] = useState('start');
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const bookingEntity = {
        id: resolvedId,
        name: resolvedName,
        purpose: (fetchedBooking?.destination_detail?.name || placeName)
            ? `Tour at ${fetchedBooking?.destination_detail?.name || placeName}`
            : "Private Tour",
        address: isAgency ? "Verified Agency" : "Local Guide",
        basePrice: tourCostGroup, 
        serviceFee: 50,
    };

    const providerLocationLabel = useMemo(() => {
        const rawLocation = isAgency
            ? (
                fetchedBooking?.agency_detail?.location
                || fetchedBooking?.agency_detail?.address
                || guideAvailability?.location
                || guideAvailability?.address
            )
            : (
                fetchedBooking?.guide_detail?.location
                || guideAvailability?.location
            );

        const normalizedLocation = typeof rawLocation === 'string' ? rawLocation.trim() : '';
        if (normalizedLocation) return normalizedLocation;

        return isAgency ? 'Agency location not set' : 'Guide location not set';
    }, [isAgency, fetchedBooking, guideAvailability]);

    const providerRatingLabel = useMemo(() => {
        const ratingCandidates = isAgency
            ? [
                fetchedBooking?.agency_detail?.guide_rating,
                fetchedBooking?.agency_detail?.average_rating,
                guideAvailability?.guide_rating,
                guideAvailability?.average_rating,
            ]
            : [
                fetchedBooking?.guide_detail?.guide_rating,
                fetchedBooking?.guide_detail?.average_rating,
                guideAvailability?.guide_rating,
                guideAvailability?.average_rating,
            ];

        const parsedRating = ratingCandidates
            .map((value) => Number.parseFloat(value))
            .find((value) => Number.isFinite(value) && value >= 0);

        return Number.isFinite(parsedRating) ? parsedRating.toFixed(1) : 'N/A';
    }, [isAgency, fetchedBooking, guideAvailability]);
    
    const effectiveAccommodationId = accommodationInitialized
        ? (selectedAccommodation?.id || fetchedBooking?.accommodation_detail?.id || null)
        : (accommodationId || fetchedBooking?.accommodation_detail?.id || null);
    const effectiveAccommodationName = accommodationInitialized
        ? (selectedAccommodation?.title || selectedAccommodation?.name || fetchedBooking?.accommodation_detail?.title || fetchedBooking?.accommodation_detail?.name || null)
        : (accommodationName || fetchedBooking?.accommodation_detail?.title || fetchedBooking?.accommodation_detail?.name || null);
    const accomEntity = (effectiveAccommodationId || effectiveAccommodationName)
        ? { name: effectiveAccommodationName || "Selected Accommodation", price: accomCost }
        : null;

    const formatDateForCalendar = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getComputedEndDate = (start, durationDays) => {
        const computed = new Date(start);
        const offsetDays = durationDays > 0 ? (durationDays - 1) : 0; 
        computed.setDate(computed.getDate() + offsetDays);
        return computed;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const mins = parts[1];
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}:${mins} ${ampm}`;
        }
        return timeStr;
    };

    const isLocalMediaUri = useCallback((value) => {
        if (!value) return false;
        return /^(file|content|ph|assets-library|data):/i.test(String(value).trim());
    }, []);

    const getApiOrigin = () => {
        try {
            const rawBase = api.defaults.baseURL;
            if (!rawBase) return null;
            const parsed = new URL(rawBase);
            return `${parsed.protocol}//${parsed.host}`;
        } catch {
            return null;
        }
    };

    const normalizeRemoteUri = useCallback((value) => {
        if (!value) return value;
        const raw = String(value).trim();

        try {
            const parsed = new URL(raw);
            const host = (parsed.hostname || '').toLowerCase();
            const isLoopbackHost = host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2';

            if (isLoopbackHost) {
                const apiOrigin = getApiOrigin();
                if (apiOrigin) {
                    return `${apiOrigin}${parsed.pathname}${parsed.search || ''}`;
                }
            }

            if (parsed.protocol === 'http:' && !isLoopbackHost) {
                parsed.protocol = 'https:';
                return parsed.toString();
            }

            return parsed.toString();
        } catch {
            return raw;
        }
    }, []);


    const getImageUrl = React.useCallback((imgPath) => {
        if (imgPath === null || imgPath === undefined) return null;
        const normalizedPath = String(imgPath).trim();
        if (!normalizedPath || normalizedPath === 'null' || normalizedPath === 'undefined') return null;

        if (isLocalMediaUri(normalizedPath)) return normalizedPath;

        const cloudinaryIndex = normalizedPath.indexOf('res.cloudinary.com/');
        if (cloudinaryIndex >= 0) {
            const cloudinaryPath = normalizedPath.slice(cloudinaryIndex);
            const cloudinaryUrl = `https://${cloudinaryPath}`;
            return encodeURI(cloudinaryUrl);
        }

        if (normalizedPath.startsWith('http')) return normalizeRemoteUri(normalizedPath);
        if (normalizedPath.startsWith('file://')) return normalizedPath;
        const base = (api.defaults.baseURL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
        const normalizedRelativePath = normalizedPath.replace(/^\/+/, '');

        const likelyMediaFolders = [
            'user_kyc/',
            'profiles/',
            'booking_ids/',
            'booking_selfies/',
            'accommodations/',
            'agency/',
        ];

        if (normalizedRelativePath.startsWith('media/')) {
            return `${base}/${normalizedRelativePath}`;
        }

        if (likelyMediaFolders.some((folder) => normalizedRelativePath.startsWith(folder))) {
            return `${base}/media/${normalizedRelativePath}`;
        }

        return `${base}/${normalizedRelativePath}`;
    }, [isLocalMediaUri, normalizeRemoteUri]);

    const normalizeDisplayImageUri = useCallback((rawPath) => {
        const uri = getImageUrl(rawPath);
        if (!uri) return null;
        if (isLocalMediaUri(uri)) return uri;
        let secureUri = normalizeRemoteUri(String(uri).replace('http://res.cloudinary.com/', 'https://res.cloudinary.com/'));

        if (/res\.cloudinary\.com/i.test(secureUri)) {
            secureUri = secureUri
                .replace('https://res.cloudinary.com/media/', 'https://res.cloudinary.com/')
                .replace('/image/upload/v1/media/user_kyc/', '/image/upload/media/user_kyc/')
                .replace('/image/upload/v1/user_kyc/', '/image/upload/media/user_kyc/');
        }

        return encodeURI(secureUri);
    }, [getImageUrl, normalizeRemoteUri, isLocalMediaUri]);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 1);
        return d;
    });
    
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 1);
        return d;
    });

    const [selectedOption, setSelectedOption] = useState('solo');
    const [numPeople, setNumPeople] = useState('1');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    const [billingErrors, setBillingErrors] = useState({});
    
    const [validIdImage, setValidIdImage] = useState(null);
    const [validIdPreviewImage, setValidIdPreviewImage] = useState(null);
    const [validIdImageLoadFailed, setValidIdImageLoadFailed] = useState(false);
    const [userSelfieImage, setUserSelfieImage] = useState(null);
    const [guestNames, setGuestNames] = useState([]);

    const [totalPrice, setTotalPrice] = useState(0);
    const [currentGuideFee, setCurrentGuideFee] = useState(0);
    const [downPayment, setDownPayment] = useState(0); 
    const [balanceDue, setBalanceDue] = useState(0); 

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('gcash');
    const paymentOptions = [
        { key: 'gcash', name: 'GCash', icon: 'wallet' },
        { key: 'paymaya', name: 'Maya', icon: 'card' },
        { key: 'qrph', name: 'QR Ph', icon: 'qr-code-outline' },
        { key: 'card', name: 'Card', icon: 'card-outline' },
    ];

    const pickerMediaTypes = 'images';
    const kycRetryHydrateRef = useRef(false);
    const kycPreviewFallbackTriedRef = useRef(false);

    const getImageSource = (uri) => {
        if (!uri) return null;
        const normalized = String(uri);
        const shouldAttachNgrokHeader = /^https?:\/\/.+ngrok/i.test(normalized);
        if (!shouldAttachNgrokHeader) {
            return { uri: normalized };
        }
        return {
            uri: normalized,
            headers: {
                'ngrok-skip-browser-warning': 'true',
            },
        };
    };

    const displayedValidIdImage = validIdPreviewImage || validIdImage;

    const handleValidIdPreviewError = () => {
        if (validIdPreviewImage && String(validIdPreviewImage).startsWith('data:') && validIdImage && validIdPreviewImage !== validIdImage) {
            setValidIdPreviewImage(validIdImage);
            return;
        }

        if (!kycPreviewFallbackTriedRef.current) {
            const fallbackCandidate = normalizeDisplayImageUri(validIdImage || displayedValidIdImage);
            if (fallbackCandidate && fallbackCandidate !== displayedValidIdImage) {
                kycPreviewFallbackTriedRef.current = true;
                setValidIdPreviewImage(fallbackCandidate);
                return;
            }
        }

        setValidIdImageLoadFailed(true);
    };

    useEffect(() => {
        const count = parseInt(numPeople) || 1;
        if (count > 1) {
            setGuestNames(prev => {
                const newArray = [...prev];
                while (newArray.length < count - 1) newArray.push('');
                return newArray.slice(0, count - 1);
            });
        } else {
            setGuestNames([]);
        }
    }, [numPeople]);

    useEffect(() => {
        if (fetchedBooking) {
            if (fetchedBooking.check_in) setStartDate(new Date(fetchedBooking.check_in));
            if (fetchedBooking.check_out) setEndDate(new Date(fetchedBooking.check_out));
            else if (fetchedBooking.check_in) setEndDate(getComputedEndDate(new Date(fetchedBooking.check_in), parseInt(paramPackageDuration) || 1));
            if (fetchedBooking.num_guests) {
                setNumPeople(String(fetchedBooking.num_guests));
                setSelectedOption(fetchedBooking.num_guests > 1 ? 'group' : 'solo');
            }
            if (fetchedBooking.additional_guest_names) {
                setGuestNames(fetchedBooking.additional_guest_names);
            }
        }
    }, [fetchedBooking, paramPackageDuration]);

    useEffect(() => {
        if (isPayable || isConfirmed || fetchedBooking) return;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const specificDates = guideAvailability?.specific_available_dates || [];
        const recurringDays = guideAvailability?.available_days || [];

        const isDateSelectable = (dateObj) => {
            const dateStr = formatDateForCalendar(dateObj);
            if (blockedDates.includes(dateStr)) return false;

            const dayName = dayNames[dateObj.getDay()];
            const isSpecific = specificDates.includes(dateStr);
            const isRecurring = recurringDays.includes('All') || recurringDays.includes(dayName);
            return specificDates.length > 0
                ? isSpecific
                : (recurringDays.length > 0 ? isRecurring : isAgency);
        };

        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const currentStart = new Date(startDate);
        currentStart.setHours(0, 0, 0, 0);

        if (currentStart >= tomorrow && isDateSelectable(currentStart)) return;

        const candidate = new Date(tomorrow);
        const limit = new Date(tomorrow);
        limit.setFullYear(limit.getFullYear() + 1);

        while (candidate <= limit && !isDateSelectable(candidate)) {
            candidate.setDate(candidate.getDate() + 1);
        }

        if (candidate <= limit) {
            const newStart = new Date(candidate);
            const newEnd = getComputedEndDate(candidate, activeDuration);
            setStartDate(newStart);
            setEndDate(newEnd);
        }
    }, [
        isPayable,
        isConfirmed,
        fetchedBooking,
        isAgency,
        guideAvailability,
        blockedDates,
        startDate,
        activeDuration,
    ]);

    useEffect(() => {
        if (!isPayable && !isConfirmed) {
            setEndDate(getComputedEndDate(startDate, activeDuration));
        }
    }, [activeDuration, startDate, isPayable, isConfirmed]);

    useEffect(() => {
        let isCancelled = false;
        const hasPendingLocalIdSelection = isLocalMediaUri(validIdImage);

        const hydratePersistedKyc = async () => {
            if (!user || validIdImage || hasPendingLocalIdSelection) return;
            try {
                const response = await api.get('/api/profile/');
                const persistedId = normalizeDisplayImageUri(response.data?.valid_id_image);
                if (!isCancelled && persistedId) {
                    setValidIdImage(persistedId);
                    setValidIdPreviewImage(persistedId);
                    setValidIdImageLoadFailed(false);
                    kycRetryHydrateRef.current = false;
                    kycPreviewFallbackTriedRef.current = false;
                }
            } catch (error) {
                console.log('KYC profile refresh skipped:', error?.message || error);
            }
        };

        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
            setPhoneNumber(formatPHPhoneLocal(user.phone_number || ''));
            setCountry(user.location || '');
            if (user.valid_id_image && !hasPendingLocalIdSelection) {
                const persistedId = normalizeDisplayImageUri(user.valid_id_image);
                if (persistedId) {
                    setValidIdImage(persistedId);
                    setValidIdPreviewImage(persistedId);
                    setValidIdImageLoadFailed(false);
                    kycRetryHydrateRef.current = false;
                    kycPreviewFallbackTriedRef.current = false;
                }
            }
        }

        hydratePersistedKyc();

        return () => {
            isCancelled = true;
        };
    }, [user, isLocalMediaUri, normalizeDisplayImageUri, validIdImage]);

    useEffect(() => {
        if (!validIdImageLoadFailed || !validIdImage || isLocalMediaUri(validIdImage)) return;
        if (kycRetryHydrateRef.current) return;

        kycRetryHydrateRef.current = true;
        let isCancelled = false;

        const retryHydrateKycImage = async () => {
            try {
                const response = await api.get('/api/profile/');
                const persistedId = normalizeDisplayImageUri(response.data?.valid_id_image);
                if (!isCancelled && persistedId) {
                    setValidIdImage(persistedId);
                    setValidIdPreviewImage(persistedId);
                    setValidIdImageLoadFailed(false);
                    kycPreviewFallbackTriedRef.current = false;
                }
            } catch (error) {
                console.log('KYC retry refresh skipped:', error?.message || error);
            }
        };

        retryHydrateKycImage();

        return () => {
            isCancelled = true;
        };
    }, [validIdImageLoadFailed, validIdImage, normalizeDisplayImageUri, isLocalMediaUri]);

    useEffect(() => {
        if (!isAgency || !resolvedId) return; 

        const fetchConcurrentBookings = async () => {
            setLoadingConcurrent(true);
            try {
                const res = await api.get('/api/bookings/');
                const relevant = (res.data || []).filter(b => {
                    if (bookingId && b.id === parseInt(bookingId)) return false; 
                    
                    const isSameProvider = b.agency === parseInt(resolvedId) || b.agency_detail?.id === parseInt(resolvedId);
                    if (!isSameProvider) return false;

                    const bookingDestinationId = Number(b.destination || b.destination_detail?.id || 0);
                    const bookingDestinationName = String(b.destination_detail?.name || '').trim().toLowerCase();

                    const hasDestinationContext = !!selectedDestinationId || !!selectedDestinationName;
                    if (hasDestinationContext) {
                        const idMatches = selectedDestinationId ? bookingDestinationId === selectedDestinationId : false;
                        const nameMatches = selectedDestinationName ? bookingDestinationName === selectedDestinationName : false;
                        if (!idMatches && !nameMatches) return false;
                    } else if (isRequestMode) {
                        return false;
                    }
                    
                    const bStart = new Date(b.check_in);
                    const bEnd = new Date(b.check_out || b.check_in);
                    bStart.setHours(0,0,0,0); bEnd.setHours(0,0,0,0);
                    
                    const selStart = new Date(startDate);
                    const selEnd = new Date(endDate);
                    selStart.setHours(0,0,0,0); selEnd.setHours(0,0,0,0);
                    
                    const overlaps = (bStart <= selEnd && bEnd >= selStart);
                    const isConfirmedStatus = ['confirmed', 'completed', 'pending_payment', 'accepted'].includes((b.status || '').toLowerCase());
                    
                    return overlaps && isConfirmedStatus;
                });
                setConcurrentBookings(relevant);
            } catch (e) {
                console.error("Failed to fetch concurrent bookings", e);
            } finally {
                setLoadingConcurrent(false);
            }
        };
        fetchConcurrentBookings();
    }, [startDate, endDate, resolvedId, isAgency, bookingId, selectedDestinationId, selectedDestinationName, isRequestMode]);

    const getMarkedDates = useMemo(() => {
        const marked = {};
        const startCalc = new Date();
        const endCalc = new Date();
        endCalc.setFullYear(startCalc.getFullYear() + 1);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const specificDates = guideAvailability?.specific_available_dates || [];
        const recurringDays = guideAvailability?.available_days || [];

        for (let d = new Date(startCalc); d <= endCalc; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const minBookableStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
            
            if (dateStr < minBookableStr) {
                marked[dateStr] = { disabled: true, disableTouchEvent: true, textColor: '#d9d9d9' };
                continue;
            }

            if (blockedDates.includes(dateStr)) {
                marked[dateStr] = { disabled: true, disableTouchEvent: true, color: '#FFEBEE', textColor: '#D32F2F', marked: true, dotColor: '#D32F2F' };
                continue;
            }

            const dayName = dayNames[d.getDay()];
            const isSpecific = specificDates.includes(dateStr);
            const isRecurring = recurringDays.includes("All") || recurringDays.includes(dayName);
            const isAvailable = specificDates.length > 0
                ? isSpecific
                : (recurringDays.length > 0 ? isRecurring : isAgency);

            if (isAvailable) marked[dateStr] = { disabled: false, textColor: TEXT_PRIMARY };
            else marked[dateStr] = { disabled: true, disableTouchEvent: true, textColor: '#d9d9d9', color: '#f9f9f9' };
        }

        const startStr = formatDateForCalendar(startDate);
        const endStr = formatDateForCalendar(endDate);
        
        if (marked[startStr] && !marked[startStr].disabled) {
            marked[startStr] = { ...marked[startStr], selected: true, selectedColor: PRIMARY_COLOR, textColor: '#fff' };
        }

        if (activeDuration > 1) {
            if (marked[endStr] && !marked[endStr].disabled) {
                marked[endStr] = { ...marked[endStr], selected: true, selectedColor: PRIMARY_COLOR, textColor: '#fff' };
            }

            let curr = new Date(startDate);
            curr.setDate(curr.getDate() + 1);
            while (curr < endDate) {
                const str = formatDateForCalendar(curr);
                if (marked[str] && !marked[str].disabled && !marked[str].color?.includes('FFEBEE')) {
                    marked[str] = { ...marked[str], selected: true, selectedColor: '#E0F2FE', textColor: PRIMARY_COLOR };
                }
                curr.setDate(curr.getDate() + 1);
            }
        }
        
        return marked;
    }, [guideAvailability, startDate, endDate, isAgency, blockedDates, activeDuration]);

    const openCalendar = (type) => { 
        if (type === 'end' && activeDuration > 1) {
            showError(`End date is locked based on the ${activeDuration}-day package you selected.`);
            return;
        }
        setSelectingType(type); 
        setCalendarVisible(true); 
    };
    
    const showError = (message) => { setErrorMessage(message); setErrorModalVisible(true); };

    const clearBillingError = (field) => {
        setBillingErrors((prev) => {
            if (!prev[field]) return prev;
            return { ...prev, [field]: '' };
        });
    };

    const checkDateBlockages = (checkStart, checkEnd) => {
        let curr = new Date(checkStart);
        let hasBlock = false;
        while(curr <= checkEnd) {
            const checkStr = formatDateForCalendar(curr);
            if(blockedDates.includes(checkStr)) { hasBlock = true; break; }
            curr.setDate(curr.getDate() + 1);
        }
        if(hasBlock) {
             setCalendarVisible(false);
             setTimeout(() => showError("Your selected package range overlaps with dates that are already booked."), 300);
             return true;
        }
        
        if (guideAvailability) {
            let checkCurr = new Date(checkStart);
            let hasUnavailable = false;
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const specificDates = guideAvailability.specific_available_dates || [];
            const recurringDays = guideAvailability.available_days || [];

            while(checkCurr <= checkEnd) {
                const dStr = formatDateForCalendar(checkCurr);
                const dayName = dayNames[checkCurr.getDay()];
                const isSpecific = specificDates.includes(dStr);
                const isRecurring = recurringDays.includes("All") || recurringDays.includes(dayName);
                const isAvailable = specificDates.length > 0
                    ? isSpecific
                    : (recurringDays.length > 0 ? isRecurring : isAgency);

                if (!isAvailable) { hasUnavailable = true; break; }
                checkCurr.setDate(checkCurr.getDate() + 1);
            }

            if (hasUnavailable) {
                setCalendarVisible(false);
                setTimeout(() => showError(`Your selected dates include days when the ${isAgency ? 'agency' : 'guide'} is unavailable.`), 300);
                return true;
            }
        }
        return false;
    }

    const onDayPress = (day) => {
        const selectedDate = new Date(day.dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
            showError("Booking for today is not allowed. Please choose tomorrow or later.");
            return;
        }

        if (blockedDates.includes(day.dateString)) { 
            showError("This date has already been booked by another traveler."); 
            return; 
        }

        if (selectingType === 'start') {
            const futureEnd = getComputedEndDate(selectedDate, activeDuration);
            
            if(checkDateBlockages(selectedDate, futureEnd)) return;
            
            setStartDate(selectedDate);
            setCalendarVisible(false);
        } else {
            const startDateString = formatDateForCalendar(startDate);
            if (day.dateString === startDateString && activeDuration > 1) {
                setCalendarVisible(false);
                setTimeout(() => showError("Multi-day packages cannot start and end on the same day."), 300); 
                return;
            }
            if (selectedDate < startDate) {
                setCalendarVisible(false);
                setTimeout(() => showError("End date cannot be before start date."), 300);
                return;
            }
            
            if(checkDateBlockages(startDate, selectedDate)) return;
            setEndDate(selectedDate);
            setCalendarVisible(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: pickerMediaTypes,
            allowsEditing: false, aspect: [4, 3], quality: 0.8, base64: true
        });
        if (!result.canceled) {
            const selectedAsset = result?.assets?.[0];
            const selectedUri = selectedAsset?.uri;
            if (!selectedUri) {
                showError('Unable to read the selected image. Please try a different photo.');
                return;
            }

            const normalizedSelectedUri = normalizeDisplayImageUri(selectedUri);
            if (!normalizedSelectedUri) {
                showError('Unable to preview the selected image. Please try another file.');
                return;
            }

            const mime = selectedAsset?.mimeType || 'image/jpeg';
            const base64Preview = selectedAsset?.base64 ? `data:${mime};base64,${selectedAsset.base64}` : null;

            setValidIdImage(normalizedSelectedUri);
            setValidIdPreviewImage(base64Preview || normalizedSelectedUri);
            setValidIdImageLoadFailed(false);
            kycRetryHydrateRef.current = false;
            kycPreviewFallbackTriedRef.current = false;
        }
    };

    const takeSelfie = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showError('Camera permission is required to take a selfie.');
            return;
        }
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: pickerMediaTypes,
            allowsEditing: true, aspect: [1, 1], quality: 0.8, cameraType: ImagePicker.CameraType.front,
        });
        if (!result.canceled) setUserSelfieImage(result.assets[0].uri);
    };

    // MAKE THIS FUNCTION ASYNC TO AWAIT THE PROFILE UPDATE
    const handleReviewPress = async () => {
        const trimmedFirstName = String(firstName || '').trim();
        const trimmedLastName = String(lastName || '').trim();
        const normalizedPhone = normalizePHPhone(phoneNumber);

        const nextBillingErrors = {};

        if (!NAME_REGEX.test(trimmedFirstName)) {
            nextBillingErrors.firstName = NAME_ERROR_MESSAGE;
        }

        if (!NAME_REGEX.test(trimmedLastName)) {
            nextBillingErrors.lastName = NAME_ERROR_MESSAGE;
        }

        if (!normalizedPhone) {
            nextBillingErrors.phoneNumber = PHONE_ERROR_MESSAGE;
        }

        if (selectedOption === 'group' && parseInt(numPeople) > 1) {
            const invalidGuestIndex = guestNames.findIndex((name) => !NAME_REGEX.test(String(name || '').trim()));
            if (invalidGuestIndex >= 0) {
                nextBillingErrors.guestNames = `Guest ${invalidGuestIndex + 2}: ${NAME_ERROR_MESSAGE}`;
            }
        }

        if (Object.values(nextBillingErrors).some(Boolean)) {
            setBillingErrors(nextBillingErrors);
            return;
        }

        setBillingErrors({});

        const startStr = formatDateForCalendar(startDate);
        const endStr = formatDateForCalendar(endDate);
        if (startStr === endStr && activeDuration > 1) { showError("Multi-day packages cannot start and end on the same day."); return; }
        if (startDate > endDate) { showError("End date cannot be before start date."); return; }

        if (!isPayable && !isConfirmed) {
            if (checkDateBlockages(startDate, endDate)) {
                return;
            }
        }

        if (selectedOption === 'group') {
            const enteredGuests = parseInt(numPeople, 10) || 1;
            const maxPax = parseInt(selectedPackage?.max_group_size, 10);
            if (Number.isFinite(maxPax) && maxPax > 0 && enteredGuests > maxPax) {
                showError(`Maximum guests for this package is ${maxPax}.`);
                return;
            }
        }
        
        if (!validIdImage && !isPayable) { showError("Please upload a valid government ID to proceed."); return; }
        if (!userSelfieImage && !isPayable) { showError("Please take a selfie for identity verification."); return; }
        
        // SAVE BILLING INFORMATION TO THE DATABASE BEFORE OPENING THE MODAL
        try {
            await api.patch('/api/profile/', {
                first_name: firstName,
                last_name: lastName,
                phone_number: normalizedPhone
            });
        } catch (error) {
            console.error("Failed to update profile billing info:", error);
            showError("Failed to save billing information. Please check your inputs and try again.");
            return;
        }

        setIsModalOpen(true);
    };

    useEffect(() => {
        if (fetchedBooking && fetchedBooking.total_price) {
            setTotalPrice(parseFloat(fetchedBooking.total_price));
            setDownPayment(parseFloat(fetchedBooking.down_payment));
            setBalanceDue(parseFloat(fetchedBooking.balance_due));
            return; 
        }

        const oneDay = 24 * 60 * 60 * 1000;
        let numDays = 1;
        let numNights = 1; 
        
        if (startDate.getTime() === endDate.getTime()) {
            numDays = 1;
            numNights = 1; 
        } else {
            numDays = Math.round(Math.abs((endDate - startDate) / oneDay)) + 1;
            numNights = numDays > 1 ? numDays - 1 : 1; 
        }

        let groupSize = parseInt(numPeople) || 1;
        let guideFee = 0;
        let extraFees = 0;

        if (selectedOption === 'solo') {
            groupSize = 1; 
            guideFee = tourCostSolo > 0 ? tourCostSolo : tourCostGroup; 
            extraFees = 0;
        } else {
            if (groupSize < 2) groupSize = 2;
            guideFee = tourCostGroup; 
            const extraPeople = Math.max(0, groupSize - 1);
            extraFees = extraPeople * extraPersonFee;
        }
        
        setCurrentGuideFee(guideFee);
        
        const totalGuideAndTourFee = (guideFee + extraFees) * numDays;
        const totalAccommodationFee = accomCost * numNights;
        
        const grandTotal = totalGuideAndTourFee + totalAccommodationFee;
        
        const dynamicDpRate = agencyDownPayment ? (parseFloat(agencyDownPayment) / 100) : 0.30;
        
        const calculatedDownPayment = grandTotal * dynamicDpRate; 
        const calculatedBalance = grandTotal - calculatedDownPayment;

        setTotalPrice(grandTotal);
        setDownPayment(calculatedDownPayment);
        setBalanceDue(calculatedBalance);
    }, [startDate, endDate, selectedOption, numPeople, tourCostGroup, tourCostSolo, accomCost, extraPersonFee, activeDuration, fetchedBooking, agencyDownPayment]);

    const profileImageSource = useMemo(() => {
        const buildSource = (rawPath) => {
            const uri = getImageUrl(rawPath);
            return uri ? { uri } : null;
        };

        if (fetchedBooking) {
            if (isAgency && (fetchedBooking.agency_detail?.logo || fetchedBooking.agency_detail?.profile_picture)) {
                const source = buildSource(fetchedBooking.agency_detail.logo || fetchedBooking.agency_detail.profile_picture);
                if (source) return source;
            }
            if (!isAgency && fetchedBooking.guide_detail?.profile_picture) {
                const source = buildSource(fetchedBooking.guide_detail.profile_picture);
                if (source) return source;
            }
        }
        if (guideAvailability) {
            if (guideAvailability.logo) {
                const source = buildSource(guideAvailability.logo);
                if (source) return source;
            }
            if (guideAvailability.profile_picture) {
                const source = buildSource(guideAvailability.profile_picture);
                if (source) return source;
            }
        }
        
        if (agencyLogo) {
            const source = buildSource(agencyLogo);
            if (source) return source;
        }
        if (guideProfilePicture) {
            const source = buildSource(guideProfilePicture);
            if (source) return source;
        }
        
        return null;
    }, [isAgency, fetchedBooking, guideAvailability, agencyLogo, guideProfilePicture, getImageUrl]);

    const displayDpPercentage = useMemo(() => {
        if (fetchedBooking && parseFloat(fetchedBooking.total_price) > 0) {
            return ((parseFloat(fetchedBooking.down_payment) / parseFloat(fetchedBooking.total_price)) * 100).toFixed(0);
        }
        if (totalPrice > 0 && downPayment > 0) {
            return ((downPayment / totalPrice) * 100).toFixed(0);
        }
        if (agencyDownPayment) return parseFloat(agencyDownPayment).toFixed(0);
        return "30"; 
    }, [fetchedBooking, agencyDownPayment, totalPrice, downPayment]);

    const pricingBreakdown = useMemo(() => {
        return buildPricingBreakdown({
            totalPrice,
            startDate,
            endDate,
            packageDurationDays: activeDuration,
            groupType: selectedOption,
            numberOfPeople: selectedOption === 'group'
                ? Math.max(parseInt(numPeople, 10) || 2, 2)
                : 1,
            tourCostPerDay: currentGuideFee,
            soloPricePerDay: selectedPackage?.solo_price,
            groupPricePerDay: selectedPackage?.price_per_day,
            extraPersonFeePerHead: extraPersonFee,
            accommodationCostPerNight: accomCost,
            packageDetail: selectedPackage,
            accommodationDetail: selectedAccommodation,
        });
    }, [
        totalPrice,
        startDate,
        endDate,
        activeDuration,
        selectedOption,
        numPeople,
        currentGuideFee,
        selectedPackage,
        extraPersonFee,
        accomCost,
        selectedAccommodation,
    ]);


    if (loadingBooking) {
        return (
            <View style={styles.loaderFallback}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
            <ScreenSafeArea statusBarStyle='light-content' style={{ flex: 1 }} edges={['bottom']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        
                        <View style={styles.header}>
                            <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.overlay} />
                            <View style={styles.headerContent}>
                                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>
                                    {isConfirmed ? "BOOKING CONFIRMED" : (isPayable ? "COMPLETE PAYMENT" : "SECURE YOUR DATE")}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.contentContainer}>
                            
                            <View style={styles.card}>
                                <View style={styles.guideHeader}>
                                    <View style={[styles.avatarContainer, profileImageSource && styles.avatarHasImage]}>
                                        {profileImageSource ? (
                                            <Image source={profileImageSource} style={styles.avatarImage} />
                                        ) : (
                                            isAgency ? <Ionicons name="business" size={28} color="#fff" /> : <User size={28} color="#fff" />
                                        )}
                                    </View>
                                    <View style={styles.guideInfo}>
                                        <Text style={styles.guideName}>{bookingEntity.name}</Text>
                                        <Text style={styles.guideLocation}>{providerLocationLabel}</Text>
                                        <View style={styles.guideRatingRow}>
                                            <Star size={14} color="#C99700" />
                                            <Text style={styles.guideRatingText}>{providerRatingLabel}</Text>
                                        </View>
                                        <Text style={styles.guideSub}>{bookingEntity.purpose}</Text>
                                        {isAgency && (
                                            <View style={styles.providerScheduleWrap}>
                                                <View style={styles.providerScheduleRow}>
                                                    <Text style={styles.providerScheduleLabel}>Operating Days:</Text>
                                                    <Text style={styles.providerScheduleValue}>{operatingDaysLabel}</Text>
                                                </View>
                                                <View style={styles.providerScheduleRow}>
                                                    <Text style={styles.providerScheduleLabel}>Operating Hours:</Text>
                                                    <Text style={styles.providerScheduleValue}>{operatingHoursLabel}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={[isPayable && {opacity: 0.7}]}>
                                
                                {!isPayable && !isConfirmed && guidePackages.length > 0 && (
                                    <>
                                        <Text style={styles.sectionTitle}>Select Package</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packageScroll}>
                                            {guidePackages.map((pkg) => {
                                                const isSelected = selectedPackage?.id === pkg.id;
                                                const duration = getPackageDurationDays(pkg);
                                                return (
                                                    <TouchableOpacity 
                                                        key={pkg.id} 
                                                        style={[styles.packagePill, isSelected && styles.packagePillActive]}
                                                        onPress={() => setSelectedPackage(pkg)}
                                                    >
                                                        <Text style={[styles.packagePillText, isSelected && styles.packagePillTextActive]}>
                                                            {duration} Day Package
                                                        </Text>
                                                    </TouchableOpacity>
                                                )
                                            })}
                                        </ScrollView>
                                    </>
                                )}
                                
                                {!isPayable && !isConfirmed && guidePackages.length === 0 && (
                                    <>
                                        <Text style={styles.sectionTitle}>Selected Package</Text>
                                        <View style={{flexDirection: 'row', marginBottom: 20}}>
                                            <View style={[styles.packagePill, styles.packagePillActive]}>
                                                <Text style={[styles.packagePillText, styles.packagePillTextActive]}>{activeDuration} Day Package</Text>
                                            </View>
                                        </View>
                                    </>
                                )}

                                <Text style={styles.sectionTitle}>Trip Details</Text>
                                {activeDuration === 1 ? (
                                    <View>
                                        <View style={styles.oneDayTripCard}>
                                            <TouchableOpacity style={[styles.dateBox, { flex: 1 }]} onPress={() => !isPayable && openCalendar('start')} disabled={isPayable}>
                                                <Text style={styles.dateLabel}>Trip Date</Text>
                                                <View style={styles.dateValueRow}>
                                                    <CalendarIcon size={18} color={PRIMARY_COLOR} />
                                                    <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.oneDayNote}>1-day package selected.</Text>
                                    </View>
                                ) : (
                                    <View style={styles.datesRow}>
                                        <TouchableOpacity style={styles.dateBox} onPress={() => !isPayable && openCalendar('start')} disabled={isPayable}>
                                            <Text style={styles.dateLabel}>Start Date</Text>
                                            <View style={styles.dateValueRow}>
                                                <CalendarIcon size={18} color={PRIMARY_COLOR} />
                                                <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.connector} />
                                        <TouchableOpacity 
                                            style={[styles.dateBox, activeDuration > 1 && { backgroundColor: '#F1F5F9' }]} 
                                            onPress={() => !isPayable && openCalendar('end')} 
                                            disabled={isPayable || activeDuration > 1}
                                        >
                                            <Text style={styles.dateLabel}>{activeDuration > 1 ? "Locked End" : "End Date"}</Text>
                                            <View style={styles.dateValueRow}>
                                                <CalendarIcon size={18} color={activeDuration > 1 ? '#94A3B8' : PRIMARY_COLOR} />
                                                <Text style={[styles.dateValue, activeDuration > 1 && { color: '#64748B' }]}>{endDate.toLocaleDateString()}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {Object.keys(groupedItinerary).length > 0 && (
                                    <View style={{ marginBottom: 20 }}>
                                        <View style={styles.sectionHeaderWithAction}>
                                            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Itinerary Schedule</Text>
                                            <TouchableOpacity
                                                style={styles.viewStopsButton}
                                                onPress={() => setStopDetailsVisible(true)}
                                            >
                                                <Ionicons name="images-outline" size={14} color="#1D4ED8" />
                                                <Text style={styles.viewStopsButtonText}>View Stop Details</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.timelineContainer}>
                                            {Object.keys(groupedItinerary).sort((a,b)=>a-b).map(day => (
                                                <View key={`seq-day-${day}`} style={{marginBottom: 20}}>
                                                    <Text style={styles.seqDayLabel}>Day {day}</Text>
                                                    
                                                    {groupedItinerary[day].map((act, idx) => (
                                                        <View key={idx} style={styles.timelineItem}>
                                                            <View style={styles.timeColumn}>
                                                                <Text style={styles.timeText}>{act.startTime}</Text>
                                                                {act.endTime && <Text style={styles.timeSubText}>{act.endTime}</Text>}
                                                                <View style={styles.timeConnector} />
                                                            </View>
                                                            <View style={styles.activityCard}>
                                                                <View style={styles.activityHeader}>
                                                                    <View style={[
                                                                        styles.activityDot, 
                                                                        { backgroundColor: act.type === 'accom' ? '#8E44AD' : PRIMARY_COLOR }
                                                                    ]} />
                                                                    <Text style={styles.activityTitle}>{act.activityName}</Text>
                                                                </View>
                                                                <View style={styles.typeBadge}>
                                                                    <Text style={styles.typeText}>
                                                                        {act.type === 'accom' ? 'Accommodation' : 'Stop / Activity'}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {!isPayable && !isConfirmed && (
                                    <View style={styles.accommodationSelectorCard}>
                                        <View style={styles.sectionHeader}>
                                            <Bed size={18} color="#1A2332" />
                                            <Text style={styles.detailsHeader}>Accommodation (Optional)</Text>
                                        </View>

                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accScroll}>
                                            <TouchableOpacity
                                                style={[styles.accCard, !selectedAccommodation && styles.accCardActive]}
                                                onPress={() => setSelectedAccommodation(null)}
                                            >
                                                <View style={{flex: 1, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center'}}>
                                                    <Bed size={32} color="#94A3B8" />
                                                    <Text style={{color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 8}}>No Stay</Text>
                                                </View>
                                                {!selectedAccommodation && <View style={styles.accCheck}><CheckCircle2 size={16} color="#fff" /></View>}
                                            </TouchableOpacity>

                                            {accommodationOptions.map((acc) => {
                                                const isSelected = Number(selectedAccommodation?.id) === Number(acc.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={acc.id}
                                                        style={[styles.accCard, isSelected && styles.accCardActive]}
                                                        onPress={() => setSelectedAccommodation(acc)}
                                                    >
                                                        {getImageUrl(acc.photo || acc.image) ? (
                                                            <Image source={{ uri: getImageUrl(acc.photo || acc.image) }} style={styles.accImage} />
                                                        ) : (
                                                            <View style={[styles.accImage, {backgroundColor: '#CBD5E1'}]} />
                                                        )}
                                                        <View style={styles.accOverlay} />
                                                        <View style={styles.accInfo}>
                                                            <Text style={styles.accTitle} numberOfLines={1}>{(acc.title || acc.name || 'Accommodation')}</Text>
                                                            <Text style={styles.accPrice}>₱{parseFloat(acc.price || 0).toLocaleString()}/day</Text>
                                                        </View>
                                                        {isSelected && <View style={styles.accCheck}><CheckCircle2 size={16} color="#fff" /></View>}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                )}

                                {(isPayable || isConfirmed) && !!effectiveAccommodationName && (
                                    <View style={styles.readonlyAccommodationCard}>
                                        <View style={styles.sectionHeader}>
                                            <Bed size={18} color="#1A2332" />
                                            <Text style={styles.detailsHeader}>Accommodation</Text>
                                        </View>
                                        <View style={styles.readonlyAccommodationRow}>
                                            <Text style={styles.readonlyAccommodationName}>{effectiveAccommodationName}</Text>
                                            <Text style={styles.readonlyAccommodationPrice}>
                                                {accomCost > 0 ? `₱${accomCost.toLocaleString()}/day` : 'Included in booking'}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.switchContainer}>
                                    <TouchableOpacity style={[styles.switchOption, selectedOption === 'solo' && styles.switchActive]} onPress={() => { setSelectedOption('solo'); setNumPeople('1'); }} disabled={isPayable}>
                                        <Text style={[styles.switchText, selectedOption === 'solo' && styles.switchTextActive]}>Solo Trip</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.switchOption, selectedOption === 'group' && styles.switchActive]} onPress={() => { setSelectedOption('group'); setNumPeople('2'); }} disabled={isPayable}>
                                        <Text style={[styles.switchText, selectedOption === 'group' && styles.switchTextActive]}>Group</Text>
                                    </TouchableOpacity>
                                </View>

                                {selectedOption === 'group' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Total Number of Guests</Text>
                                        <TextInput
                                            style={styles.modernInput}
                                            value={numPeople}
                                            onChangeText={(text) => { if (text === '' || /^[0-9]+$/.test(text)) setNumPeople(text); }}
                                            keyboardType="numeric"
                                            editable={!isPayable}
                                        />

                                        {parseInt(numPeople) > 1 && (
                                            <View style={styles.guestNamesContainer}>
                                                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                                                    <Ionicons name="people-circle-outline" size={18} color={PRIMARY_COLOR} />
                                                    <Text style={[styles.inputLabel, {marginBottom: 0, marginLeft: 6}]}>Additional Guest Names</Text>
                                                </View>
                                                <Text style={{fontSize: 11, color: '#B45309', fontStyle: 'italic', marginBottom: 12}}>
                                                    * Please ensure all guests provide a valid ID upon meetup.
                                                </Text>
                                                {guestNames.map((name, index) => (
                                                    <TextInput
                                                        key={`guest-${index}`}
                                                        style={[styles.modernInput, {marginBottom: 8}]}
                                                        placeholder={`Guest ${index + 2} Full Name`}
                                                        value={name}
                                                        onChangeText={(text) => {
                                                            const newNames = [...guestNames];
                                                            newNames[index] = text;
                                                            setGuestNames(newNames);
                                                            clearBillingError('guestNames');
                                                        }}
                                                        editable={!isPayable}
                                                    />
                                                ))}
                                                {!!billingErrors.guestNames && <Text style={styles.fieldErrorText}>{billingErrors.guestNames}</Text>}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {fetchedBooking?.assigned_agency_guides_detail && fetchedBooking.assigned_agency_guides_detail.length > 0 && (
                                <View style={{ marginTop: 24 }}>
                                    <Text style={styles.sectionTitle}>Assigned Guide Team</Text>
                                    {fetchedBooking.assigned_agency_guides_detail.map((guide, index) => (
                                        <View key={guide.id || index} style={styles.assignedGuideCard}>
                                            <View style={styles.assignedGuideAvatar}>
                                                {guide.profile_picture ? (
                                                    <Image source={{ uri: getImageUrl(guide.profile_picture) }} style={styles.guideAvatarImage} />
                                                ) : (
                                                    <User size={20} color="#64748B" />
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.assignedGuideName}>{guide.full_name}</Text>
                                                <Text style={styles.assignedGuideRole}>{index === 0 ? 'Lead Guide' : 'Support Guide'}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {fetchedBooking?.meetup_location && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Meetup & Coordination</Text>
                                    <View style={styles.meetupCard}>
                                        <View style={styles.meetupRow}>
                                            <View style={styles.meetupIconBox}><Ionicons name="location" size={18} color="#0072FF" /></View>
                                            <View style={{flex: 1}}>
                                                <Text style={styles.meetupLabel}>Location</Text>
                                                <Text style={styles.meetupValue}>{fetchedBooking.meetup_location}</Text>
                                            </View>
                                        </View>
                                        
                                        {fetchedBooking.meetup_time && (
                                            <View style={styles.meetupRow}>
                                                <View style={styles.meetupIconBox}><Ionicons name="time" size={18} color="#0072FF" /></View>
                                                <View style={{flex: 1}}>
                                                    <Text style={styles.meetupLabel}>Time</Text>
                                                    <Text style={styles.meetupValue}>{formatTime(fetchedBooking.meetup_time)}</Text>
                                                </View>
                                            </View>
                                        )}
                                        
                                        {fetchedBooking.meetup_instructions && (
                                            <View style={[styles.meetupRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                                                <View style={styles.meetupIconBox}><Ionicons name="information-circle" size={18} color="#0072FF" /></View>
                                                <View style={{flex: 1}}>
                                                    <Text style={styles.meetupLabel}>Instructions</Text>
                                                    <Text style={styles.meetupValue}>{fetchedBooking.meetup_instructions}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </>
                            )}

                            {!isPayable && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Billing Details</Text>
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <TextInput style={[styles.modernInput, {flex:1}]} placeholder="First Name" placeholderTextColor="#64748B" value={firstName} onChangeText={(value) => {
                                                setFirstName(value);
                                                clearBillingError('firstName');
                                            }} />
                                            {!!billingErrors.firstName && <Text style={styles.fieldErrorText}>{billingErrors.firstName}</Text>}
                                        </View>
                                        <View style={{width: 10}}/>
                                        <View style={{ flex: 1 }}>
                                            <TextInput style={[styles.modernInput, {flex:1}]} placeholder="Last Name" placeholderTextColor="#64748B" value={lastName} onChangeText={(value) => {
                                                setLastName(value);
                                                clearBillingError('lastName');
                                            }} />
                                            {!!billingErrors.lastName && <Text style={styles.fieldErrorText}>{billingErrors.lastName}</Text>}
                                        </View>
                                    </View>
                                    <TextInput style={[styles.modernInput, {marginTop: 10}]} placeholder="Phone Number" placeholderTextColor="#64748B" keyboardType="phone-pad" value={phoneNumber} onChangeText={(value) => {
                                        setPhoneNumber(formatPHPhoneLocal(value));
                                        clearBillingError('phoneNumber');
                                    }} />
                                    {!!billingErrors.phoneNumber && <Text style={styles.fieldErrorText}>{billingErrors.phoneNumber}</Text>}

                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Identity Verification (ID & Selfie)</Text>
                                    <View style={styles.kycRow}>
                                        <View style={styles.kycItem}>
                                            <TouchableOpacity style={[styles.kycCard, validIdImage && styles.kycCardDone]} onPress={pickImage}>
                                                {displayedValidIdImage && !validIdImageLoadFailed ? (
                                                    <Image
                                                        source={getImageSource(displayedValidIdImage)}
                                                        style={styles.kycImage}
                                                        onLoad={() => {
                                                            if (validIdImageLoadFailed) setValidIdImageLoadFailed(false);
                                                        }}
                                                        onError={handleValidIdPreviewError}
                                                    />
                                                ) : (
                                                    <View style={styles.kycPlaceholder}>
                                                        <UploadCloud size={24} color={PRIMARY_COLOR} />
                                                        <Text style={styles.kycText}>{validIdImage ? 'Preview unavailable. Tap to reselect' : 'Upload ID'}</Text>
                                                    </View>
                                                )}
                                                {validIdImage && <View style={styles.checkBubble}><CheckCircle2 size={16} color="#fff" /></View>}
                                            </TouchableOpacity>
                                            <Text style={styles.kycItemLabel}>ID</Text>
                                        </View>

                                        <View style={styles.kycItem}>
                                            <TouchableOpacity style={[styles.kycCard, userSelfieImage && styles.kycCardDone]} onPress={takeSelfie}>
                                                {userSelfieImage ? (
                                                    <Image source={{ uri: userSelfieImage }} style={styles.kycImage} />
                                                ) : (
                                                    <View style={styles.kycPlaceholder}>
                                                        <Ionicons name="camera-outline" size={28} color={PRIMARY_COLOR} />
                                                        <Text style={styles.kycText}>Take Selfie</Text>
                                                    </View>
                                                )}
                                                {userSelfieImage && <View style={styles.checkBubble}><CheckCircle2 size={16} color="#fff" /></View>}
                                            </TouchableOpacity>
                                            <Text style={styles.kycItemLabel}>Selfie Photo</Text>
                                        </View>
                                    </View>
                                </>
                            )}

                            {((!isAgencyRequestMode && isRequestMode) || isPayable || isConfirmed) && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment Method</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentScroll}>
                                        {paymentOptions.map((opt) => (
                                            <TouchableOpacity 
                                                key={opt.key} 
                                                style={[styles.paymentOption, selectedPaymentMethod === opt.key && styles.paymentOptionActive]}
                                                onPress={() => !isConfirmed && setSelectedPaymentMethod(opt.key)}
                                                disabled={isConfirmed}
                                            >
                                                <View style={[styles.paymentIconCircle, selectedPaymentMethod === opt.key && styles.paymentIconCircleActive]}>
                                                    <Ionicons name={opt.icon} size={20} color={selectedPaymentMethod === opt.key ? '#fff' : TEXT_SECONDARY} />
                                                </View>
                                                <Text style={[styles.paymentText, selectedPaymentMethod === opt.key && styles.paymentTextActive]}>{opt.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            <SafeAreaView edges={['bottom']} style={[styles.receiptCard, { marginBottom: isAgency ? 20 : 40 }]}>
                                <View style={styles.receiptHeader}>
                                    <Text style={styles.receiptTitle}>Payment Summary</Text>
                                </View>
                                <View style={styles.receiptRow}>
                                    <Text style={styles.receiptLabel}>Total Trip Cost</Text>
                                    <Text style={styles.receiptValue}>₱ {totalPrice.toLocaleString()}</Text>
                                </View>
                                {pricingBreakdown.hasBreakdownItems && (
                                    <>
                                        <View style={styles.receiptSubRow}>
                                            <Text style={styles.receiptSubLabel}>
                                                Package ({pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''} x ₱ {pricingBreakdown.packageRatePerDay.toLocaleString()}/day)
                                            </Text>
                                            <Text style={styles.receiptSubValue}>₱ {pricingBreakdown.packageSubtotal.toLocaleString()}</Text>
                                        </View>

                                        {pricingBreakdown.extraGuests > 0 && pricingBreakdown.extraGuestSubtotal > 0 && (
                                            <View style={styles.receiptSubRow}>
                                                <Text style={styles.receiptSubLabel}>
                                                    Extra guests ({pricingBreakdown.extraGuests} x ₱ {pricingBreakdown.extraFeePerHead.toLocaleString()} x {pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''})
                                                </Text>
                                                <Text style={styles.receiptSubValue}>₱ {pricingBreakdown.extraGuestSubtotal.toLocaleString()}</Text>
                                            </View>
                                        )}

                                        {pricingBreakdown.accommodationSubtotal > 0 && (
                                            <View style={styles.receiptSubRow}>
                                                <Text style={styles.receiptSubLabel}>
                                                    Accommodation ({pricingBreakdown.nights} night{pricingBreakdown.nights > 1 ? 's' : ''} x ₱ {pricingBreakdown.accommodationRatePerNight.toLocaleString()}/night)
                                                </Text>
                                                <Text style={styles.receiptSubValue}>₱ {pricingBreakdown.accommodationSubtotal.toLocaleString()}</Text>
                                            </View>
                                        )}

                                        {pricingBreakdown.hasAdjustment && (
                                            <View style={styles.receiptSubRow}>
                                                <Text style={styles.receiptSubLabel}>Adjustment</Text>
                                                <Text style={styles.receiptSubValue}>
                                                    {pricingBreakdown.adjustmentAmount >= 0 ? '₱ ' : '- ₱ '}
                                                    {Math.abs(pricingBreakdown.adjustmentAmount).toLocaleString()}
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}
                                <View style={styles.receiptDivider} />
                                <View style={styles.receiptRow}>
                                    <Text style={[styles.receiptLabel, {color: TEXT_PRIMARY, fontWeight:'700'}]}>
                                        Down Payment ({displayDpPercentage}%)
                                    </Text>
                                    <Text style={[styles.receiptTotal, {color: PRIMARY_COLOR}]}>₱ {downPayment.toLocaleString()}</Text>
                                </View>
                                <Text style={styles.receiptNote}>{isConfirmed ? "Paid Successfully" : "Payable now to secure dates"}</Text>
                                <View style={[styles.receiptRow, {marginTop: 12}]}>
                                    <Text style={styles.receiptLabel}>Balance Due Later</Text>
                                    <Text style={styles.receiptValue}>₱ {balanceDue.toLocaleString()}</Text>
                                </View>
                            </SafeAreaView>

                            {isAgency && (
                                <TouchableOpacity 
                                    style={styles.viewManifestButton}
                                    onPress={() => setManifestModalVisible(true)}
                                >
                                    <Ionicons name="people" size={20} color={PRIMARY_COLOR} />
                                    <Text style={styles.viewManifestButtonText}>See other people on these dates</Text>
                                </TouchableOpacity>
                            )}

                            <View style={{height: 40}} />

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {!isConfirmed ? (
                    <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                        <View>
                            <Text style={styles.bottomLabel}>Total Payable Now</Text>
                            <Text style={styles.bottomPrice}>₱{downPayment.toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity style={styles.payButton} onPress={handleReviewPress}>
                            <Text style={styles.payButtonText}>
                                {isPayable ? "Confirm Payment" : (isAgencyRequestMode ? "Submit Request" : "Pay & Book")}
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    </SafeAreaView>
                ) : (
                    <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                        <TouchableOpacity style={[styles.payButton, {backgroundColor: '#059669', width: '100%'}]} onPress={() => router.push('/(protected)/home')}>
                            <Ionicons name="home" size={18} color="#fff" style={{marginRight:8}}/>
                            <Text style={styles.payButtonText}>Return Home</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                )}

                {isAgency && (
                    <Modal visible={manifestModalVisible} transparent={true} animationType="slide">
                        <View style={styles.manifestModalOverlay}>
                            <View style={styles.manifestModalContainer}>
                                <View style={styles.manifestModalHeader}>
                                    <Text style={styles.manifestModalTitle}>Daily Manifest</Text>
                                    <TouchableOpacity onPress={() => setManifestModalVisible(false)} style={styles.closeBtn}>
                                        <Ionicons name="close" size={24} color="#333" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {loadingConcurrent ? (
                                        <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{marginVertical: 20}} />
                                    ) : concurrentBookings.length === 0 ? (
                                        <View style={styles.emptyManifest}>
                                            <Ionicons name="calendar-outline" size={32} color="#CBD5E1" />
                                            <Text style={styles.emptyManifestText}>No other tourists scheduled for these dates.</Text>
                                        </View>
                                    ) : (
                                        concurrentBookings.map((b, i) => (
                                            <View key={b.id || i} style={styles.manifestCard}>
                                                <View style={styles.manifestHeader}>
                                                    <Ionicons name="person-circle" size={24} color={PRIMARY_COLOR} />
                                                    <Text style={styles.manifestGuest}>{b.tourist_username || b.tourist_detail?.username || "Guest"}</Text>
                                                    <View style={styles.manifestPaxBadge}>
                                                        <Text style={styles.manifestPaxText}>{b.num_guests} Pax</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.manifestRow}>
                                                    <Text style={styles.manifestLabel}>Dates:</Text>
                                                    <Text style={styles.manifestValue}>{b.check_in} to {b.check_out}</Text>
                                                </View>
                                                {b.meetup_location && (
                                                    <View style={styles.manifestRow}>
                                                        <Text style={styles.manifestLabel}>Pickup:</Text>
                                                        <Text style={styles.manifestValue}>{b.meetup_location}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))
                                    )}
                                    <View style={{height: 20}} />
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>
                )}

                <Modal visible={isCalendarVisible} transparent={true} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.calendarCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select {selectingType === 'start' ? 'Start' : 'End'} Date</Text>
                                <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={20} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <Calendar
                                current={(() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 1);
                                    return d.toISOString().split('T')[0];
                                })()}
                                minDate={(() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 1);
                                    return d.toISOString().split('T')[0];
                                })()}
                                markedDates={getMarkedDates}
                                onDayPress={onDayPress}
                                theme={{ 
                                    todayTextColor: PRIMARY_COLOR, 
                                    arrowColor: PRIMARY_COLOR, 
                                    textMonthFontWeight: '800', 
                                    textDayHeaderFontWeight: '600' 
                                }}
                            />
                        </View>
                    </View>
                </Modal>

                <StopDetailsModal
                    visible={stopDetailsVisible}
                    onClose={() => setStopDetailsVisible(false)}
                    timeline={parsedItinerary}
                    stopCatalog={itineraryStopCatalog}
                    accommodationCatalog={itineraryAccommodationCatalog}
                    getImageUrl={getImageUrl}
                />

                <Modal visible={errorModalVisible} transparent={true} animationType="fade">
                    <View style={styles.errorOverlay}>
                        <View style={styles.errorCard}>
                            <View style={styles.errorIconBox}><AlertCircle size={32} color="#EF4444" /></View>
                            <Text style={styles.errorTitle}>Oops!</Text>
                            <Text style={styles.errorMessage}>{errorMessage}</Text>
                            <TouchableOpacity style={styles.errorButton} onPress={() => setErrorModalVisible(false)}>
                                <Text style={styles.errorButtonText}>Okay, Got it</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {isModalOpen && (
                    <PaymentReviewModal
                        isModalOpen={isModalOpen}
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            [isAgency ? 'agency' : 'guide']: bookingEntity,
                            accommodation: accomEntity, accommodationId: effectiveAccommodationId,
                            tourPackageId: selectedPackage ? selectedPackage.id : tourPackageId,
                            startDate, endDate, firstName, lastName, phoneNumber: normalizePHPhone(phoneNumber) || phoneNumber, country, email,
                            basePrice: bookingEntity.basePrice, serviceFee: bookingEntity.serviceFee,
                            totalPrice, downPayment, balanceDue, bookingId, placeId,
                            paymentMethod: selectedPaymentMethod, groupType: selectedOption,
                            numberOfPeople: selectedOption === 'group' ? (parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) : 1,
                            additionalGuestNames: guestNames, 
                            validIdImage, userSelfieImage, isNewKycImage: isLocalMediaUri(validIdImage),
                            tourCost: currentGuideFee, accomCost, extraPersonFee,
                            packageDurationDays: activeDuration,
                            status: currentStatus,
                            itineraryTimeline: activeItinerary,           
                            accommodationName: effectiveAccommodationName 
                        }}
                    />
                )}
            </ScreenSafeArea>
        </View>
    );
};

export default Payment;

const styles = StyleSheet.create({
    container: { flex: 1 },
    loaderFallback: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    header: { height: 100, position: 'relative', marginBottom: 20 },
    headerImage: { width: '100%', height: '100%', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { position: 'absolute', bottom: 15, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 15, padding: 5 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
    contentContainer: { paddingHorizontal: 20 },
    card: { backgroundColor: SURFACE_COLOR, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
    guideHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarHasImage: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', padding: 1 },
    avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
    guideInfo: { flex: 1 },
    guideName: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
    guideLocation: { fontSize: 13, color: '#8B98A8', marginTop: 2 },
    guideRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    guideRatingText: { fontSize: 13, color: '#C99700', marginLeft: 4, fontWeight: '600' },
    guideSub: { fontSize: 13, color: TEXT_SECONDARY },
    providerScheduleWrap: { marginTop: 8, gap: 2 },
    providerScheduleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    providerScheduleLabel: { fontSize: 12, color: '#334155', fontWeight: '600', marginRight: 4 },
    providerScheduleValue: { fontSize: 12, color: '#0F172A', fontWeight: '700' },
    verifiedTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4, backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    verifiedText: { fontSize: 11, color: '#059669', fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 12 },
    sectionHeaderWithAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    viewStopsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    viewStopsButtonText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
    
    packageScroll: { flexDirection: 'row', marginBottom: 20 },
    packagePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    packagePillActive: { backgroundColor: '#EFF6FF', borderColor: PRIMARY_COLOR },
    packagePillText: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY },
    packagePillTextActive: { color: PRIMARY_COLOR },
    accommodationSelectorCard: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 14, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 14 },
    readonlyAccommodationCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
    readonlyAccommodationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    readonlyAccommodationName: { flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, marginRight: 10 },
    readonlyAccommodationPrice: { fontSize: 13, fontWeight: '700', color: '#0369A1' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    detailsHeader: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    
    accScroll: { marginTop: 10, paddingBottom: 5 },
    accCard: { width: 140, marginRight: 12, backgroundColor: SURFACE_COLOR, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', overflow: 'hidden', position: 'relative', height: 110 },
    accCardActive: { borderColor: PRIMARY_COLOR },
    accImage: { width: '100%', height: '100%', position: 'absolute' },
    accOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: 'rgba(0,0,0,0.5)' },
    accInfo: { position: 'absolute', bottom: 8, left: 8, right: 8 },
    accTitle: { fontSize: 13, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 3 },
    accPrice: { fontSize: 11, color: '#E0F2FE', fontWeight: '700', marginTop: 2 },
    accCheck: { position: 'absolute', top: 8, right: 8, backgroundColor: PRIMARY_COLOR, borderRadius: 12, padding: 2 },

    seqDayLabel: { fontSize: 15, fontWeight: '800', color: PRIMARY_COLOR, marginBottom: 10 },
    timelineContainer: { marginTop: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 15 },
    timeColumn: { width: 85, alignItems: 'center', paddingRight: 10 },
    timeText: { fontSize: 12, fontWeight: '700', color: TEXT_PRIMARY },
    timeSubText: { fontSize: 10, color: TEXT_SECONDARY, marginTop: 2 },
    timeConnector: { flex: 1, width: 1, backgroundColor: '#E2E8F0', marginTop: 4 },
    
    activityCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
    
    typeBadge: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    typeText: { fontSize: 10, color: TEXT_SECONDARY, fontWeight: '600' },
    
    datesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    oneDayTripCard: { marginBottom: 6 },
    oneDayNote: { fontSize: 12, color: '#64748B', marginBottom: 20, fontStyle: 'italic' },
    dateBox: { flex: 1, backgroundColor: SURFACE_COLOR, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    dateLabel: { fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 },
    dateValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateValue: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
    connector: { width: 10, height: 1, backgroundColor: '#CBD5E1', marginHorizontal: 10 },
    switchContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 16 },
    switchOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    switchActive: { backgroundColor: PRIMARY_COLOR, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    switchText: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY },
    switchTextActive: { color: '#FFFFFF', fontWeight: '700' },
    modernInput: { backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: TEXT_PRIMARY, },
    inputRow: { flexDirection: 'row' },
    fieldErrorText: { color: '#DC2626', fontSize: 12, lineHeight: 16, marginTop: 6, marginBottom: 8, fontWeight: '600' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 8 },
    
    guestNamesContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#E2E8F0' },

    kycRow: { flexDirection: 'row', gap: 12 },
    kycItem: { flex: 1, alignItems: 'center' },
    kycCard: { width: '100%', height: 120, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    kycCardDone: { borderStyle: 'solid', borderColor: '#22C55E' },
    kycPlaceholder: { alignItems: 'center', gap: 8 },
    kycText: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
    kycImage: { width: '100%', height: '100%' },
    checkBubble: { position: 'absolute', top: 8, right: 8, backgroundColor: '#22C55E', borderRadius: 12, padding: 2 },
    kycItemLabel: { marginTop: 8, fontSize: 12, color: '#475569', fontWeight: '700' },
    paymentScroll: { flexDirection: 'row', marginBottom: 24 },
    paymentOption: { marginRight: 12, width: 80, height: 80, backgroundColor: SURFACE_COLOR, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', gap: 8 },
    paymentOptionActive: { borderColor: PRIMARY_COLOR, backgroundColor: '#EFF6FF' },
    paymentIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    paymentIconCircleActive: { backgroundColor: PRIMARY_COLOR },
    paymentText: { fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY },
    paymentTextActive: { color: PRIMARY_COLOR },
    receiptCard: { backgroundColor: SURFACE_COLOR, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
    receiptHeader: { alignItems: 'center', marginBottom: 16 },
    receiptTitle: { fontSize: 14, fontWeight: '700', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    receiptLabel: { fontSize: 14, color: TEXT_SECONDARY },
    receiptValue: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
    receiptSubRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingLeft: 20 },
    receiptSubLabel: { flex: 1, fontSize: 12, color: '#475569', marginRight: 10 },
    receiptSubValue: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
    receiptTotal: { fontSize: 18, fontWeight: '800' },
    receiptDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
    receiptNote: { fontSize: 11, color: PRIMARY_COLOR, fontStyle: 'italic', textAlign: 'right' },
    
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: SURFACE_COLOR, paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:-2}, shadowOpacity:0.05, shadowRadius:10, elevation:10 },
    bottomLabel: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '600' },
    bottomPrice: { fontSize: 20, color: TEXT_PRIMARY, fontWeight: '800' },
    payButton: { backgroundColor: PRIMARY_COLOR, flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', gap: 8, shadowColor: PRIMARY_COLOR, shadowOffset: {width:0, height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:4 },
    payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    calendarCard: { backgroundColor: SURFACE_COLOR, borderRadius: 24, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
    closeBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 20 },
    errorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    errorCard: { width: '85%', backgroundColor: SURFACE_COLOR, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
    errorIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    errorTitle: { fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 8 },
    errorMessage: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    errorButton: { backgroundColor: '#EF4444', paddingVertical: 12, width: '100%', alignItems: 'center', borderRadius: 12 },
    errorButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    assignedGuideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
    assignedGuideAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
    guideAvatarImage: { width: '100%', height: '100%' },
    assignedGuideName: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
    assignedGuideRole: { fontSize: 12, color: '#0072FF', fontWeight: '600', marginTop: 2 },
    
    meetupCard: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 8 },
    meetupRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#D1E8FF' },
    meetupIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    meetupLabel: { fontSize: 11, color: '#60A5FA', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    meetupValue: { fontSize: 14, color: '#1E3A8A', fontWeight: '600' },

    viewManifestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 20 },
    viewManifestButtonText: { color: PRIMARY_COLOR, fontSize: 14, fontWeight: '700', marginLeft: 8 },
    manifestModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    manifestModalContainer: { backgroundColor: SURFACE_COLOR, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 20 },
    manifestModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    manifestModalTitle: { fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY },

    manifestCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
    manifestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    manifestGuest: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1E293B', marginLeft: 8 },
    manifestPaxBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    manifestPaxText: { color: '#1D4ED8', fontWeight: '800', fontSize: 12 },
    manifestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    manifestLabel: { fontSize: 13, color: '#64748B', width: 60 },
    manifestValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', flex: 1, textAlign: 'right' },
    emptyManifest: { padding: 30, backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', marginTop: 20 },
    emptyManifestText: { color: '#64748B', fontStyle: 'italic', marginTop: 10, fontSize: 13 },
});