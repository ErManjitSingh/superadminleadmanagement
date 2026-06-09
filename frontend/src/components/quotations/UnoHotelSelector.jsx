import { useEffect, useState } from 'react';
import { ArrowLeft, BedDouble, Building2, Loader2, UtensilsCrossed } from 'lucide-react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import { formatINR } from './quotationUtils';
import { cn } from '../../lib/utils';

const SUB_STEPS = [
  { key: 'hotel', label: 'Hotel', icon: Building2 },
  { key: 'room', label: 'Room', icon: BedDouble },
  { key: 'meal', label: 'Meal Plan', icon: UtensilsCrossed },
];

function ImageCard({ src, alt, className }) {
  if (!src) {
    return (
      <div className={cn('bg-surface-elevated flex items-center justify-center text-content-muted text-xs', className)}>
        No image
      </div>
    );
  }
  return <img src={src} alt={alt} className={cn('object-cover', className)} loading="lazy" />;
}

export default function UnoHotelSelector({ destination, value, onChange, nights = 1 }) {
  const [subStep, setSubStep] = useState('hotel');
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [hotelDetail, setHotelDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingHotels(true);
    API.get('/uno-hotels', {
      params: { destination, limit: 24 },
      skipErrorToast: true,
    })
      .then((res) => {
        if (!cancelled) setHotels(res.data?.items || []);
      })
      .catch(() => {
        if (!cancelled) setHotels([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHotels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [destination]);

  const selectHotel = async (hotel) => {
    setLoadingDetail(true);
    setHotelDetail(null);
    onChange(null);
    try {
      const res = await API.get('/uno-hotels/detail', {
        params: { city: hotel.city, slug: hotel.slug },
        skipErrorToast: true,
      });
      setHotelDetail(res.data);
      onChange({ hotel: res.data, room: null, mealPlan: null, nights, totalCost: 0 });
      setSubStep('room');
    } catch {
      setHotelDetail(hotel);
      onChange({ hotel, room: null, mealPlan: null, nights, totalCost: 0 });
      setSubStep('room');
    } finally {
      setLoadingDetail(false);
    }
  };

  const selectRoom = (room) => {
    const hotel = hotelDetail || value?.hotel;
    onChange({ hotel, room, mealPlan: null, nights, totalCost: 0 });
    setSubStep('meal');
  };

  const selectMealPlan = (mealPlan) => {
    const hotel = hotelDetail || value?.hotel;
    const room = value?.room;
    const perNight = Number(room?.pricePerNight || 0) + Number(mealPlan?.price || 0);
    const totalCost = perNight * Math.max(1, nights);
    onChange({ hotel, room, mealPlan, nights, perNight, totalCost });
  };

  const activeHotel = hotelDetail || value?.hotel;
  const rooms = activeHotel?.rooms || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {SUB_STEPS.map(({ key, label, icon: Icon }, index) => {
          const active = subStep === key;
          const done =
            (key === 'hotel' && value?.hotel) ||
            (key === 'room' && value?.room) ||
            (key === 'meal' && value?.mealPlan);
          return (
            <div key={key} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium flex-1',
                  active && 'border-amber-500/50 bg-amber-500/10 text-amber-800',
                  !active && done && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
                  !active && !done && 'border-subtle text-content-muted'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </div>
              {index < SUB_STEPS.length - 1 && <div className="w-3 h-px bg-subtle shrink-0" />}
            </div>
          );
        })}
      </div>

      {subStep !== 'hotel' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg gap-1.5"
          onClick={() => setSubStep(subStep === 'meal' ? 'room' : 'hotel')}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {subStep === 'meal' ? 'Rooms' : 'Hotels'}
        </Button>
      )}

      {subStep === 'hotel' && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold">Select Hotel</h2>
            <p className="text-xs text-content-muted">Hotels matching lead destination{destination ? `: ${destination}` : ''}</p>
          </div>
          {loadingHotels ? (
            <div className="flex items-center justify-center py-12 text-content-muted gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading hotels...
            </div>
          ) : hotels.length === 0 ? (
            <p className="text-sm text-content-muted py-8 text-center">No hotels found for this destination.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
              {hotels.map((hotel) => (
                <button
                  key={hotel.id}
                  type="button"
                  disabled={loadingDetail}
                  onClick={() => selectHotel(hotel)}
                  className={cn(
                    'rounded-xl border text-left overflow-hidden transition-all',
                    value?.hotel?.id === hotel.id
                      ? 'border-amber-500/50 ring-2 ring-amber-500/20'
                      : 'border-subtle hover:border-amber-500/30'
                  )}
                >
                  <ImageCard src={hotel.thumbnailUrl || hotel.images?.[0]} alt={hotel.name} className="w-full h-32" />
                  <div className="p-3">
                    <p className="font-semibold text-sm">{hotel.name}</p>
                    <p className="text-xs text-content-muted mt-0.5">{hotel.location} · {hotel.category}</p>
                    <p className="text-sm font-bold text-amber-700 mt-2">from {formatINR(hotel.startingPrice)}/night</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {loadingDetail && (
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading rooms...
            </p>
          )}
        </div>
      )}

      {subStep === 'room' && activeHotel && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold">Select Room</h2>
            <p className="text-xs text-content-muted">{activeHotel.name} · {activeHotel.location}</p>
          </div>
          {rooms.length === 0 ? (
            <p className="text-sm text-content-muted py-8 text-center">No rooms available for this hotel.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => selectRoom(room)}
                  className={cn(
                    'w-full rounded-xl border text-left overflow-hidden flex gap-3 p-3',
                    value?.room?.id === room.id
                      ? 'border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/20'
                      : 'border-subtle hover:bg-surface-elevated'
                  )}
                >
                  <ImageCard src={room.images?.[0]} alt={room.name} className="w-28 h-24 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{room.name}</p>
                    <p className="text-xs text-content-muted mt-1 line-clamp-2">{room.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-content-muted">
                      {room.bedType && <span className="px-2 py-0.5 rounded-full bg-surface-elevated">{room.bedType}</span>}
                      {room.maxOccupancy && <span className="px-2 py-0.5 rounded-full bg-surface-elevated">Max {room.maxOccupancy}</span>}
                      {room.sizeSqft && <span className="px-2 py-0.5 rounded-full bg-surface-elevated">{room.sizeSqft} sqft</span>}
                    </div>
                    <p className="text-sm font-bold text-amber-700 mt-2">{formatINR(room.pricePerNight)}/night</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {subStep === 'meal' && value?.room && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold">Select Meal Plan</h2>
            <p className="text-xs text-content-muted">
              {activeHotel?.name} · {value.room.name}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {(value.room.mealPlanOptions || []).map((plan) => (
              <button
                key={plan.key}
                type="button"
                onClick={() => selectMealPlan(plan)}
                className={cn(
                  'p-4 rounded-xl border text-left',
                  value?.mealPlan?.key === plan.key
                    ? 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'border-subtle hover:bg-surface-elevated'
                )}
              >
                <p className="font-semibold text-sm">{plan.label}</p>
                <p className="text-xs text-content-muted mt-1">
                  {plan.price > 0 ? `+ ${formatINR(plan.price)}/person/night` : 'Included with room only'}
                </p>
                {value?.mealPlan?.key === plan.key && (
                  <p className="text-xs font-medium text-emerald-700 mt-2">
                    Total: {formatINR(value.totalCost)} for {nights} night(s)
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function parsePackageNights(pkg) {
  if (!pkg) return 1;
  const label = String(pkg.durationLabel || '');
  const nightMatch = label.match(/(\d+)\s*N/i);
  if (nightMatch) return Math.max(1, Number(nightMatch[1]));
  return Math.max(1, Number(pkg.duration || 1) - 1);
}
