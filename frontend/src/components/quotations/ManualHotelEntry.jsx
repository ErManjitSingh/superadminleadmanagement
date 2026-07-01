import { useEffect, useState } from 'react';
import { Building2, ImagePlus, Trash2, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { HOTEL_CATEGORIES, MEAL_PLANS } from './constants';
import { formatINR } from './quotationUtils';
import { readHotelImageFile, formatImageSize, MAX_HOTEL_IMAGE_BYTES } from './hotelImageUtils';
import { cn } from '../../lib/utils';

const DEFAULT_MEAL_OPTIONS = MEAL_PLANS.map((label, index) => ({
  key: `meal-${index}`,
  label,
  price: 0,
}));

function buildManualSelection({ day, destination, form, imageDataUrl }) {
  const perNight = Number(form.pricePerNight) || 0;
  const mealPlan =
    DEFAULT_MEAL_OPTIONS.find((m) => m.label === form.mealPlan) ||
    { key: 'custom', label: form.mealPlan || 'Room Only', price: 0 };

  return {
    day,
    hotel: {
      id: form.hotelId || `manual-hotel-${day}-${Date.now()}`,
      name: form.hotelName.trim(),
      category: form.hotelCategory || '',
      city: destination || '',
      location: destination || '',
      thumbnailUrl: imageDataUrl || '',
      images: imageDataUrl ? [imageDataUrl] : [],
      isManual: true,
    },
    room: {
      id: `manual-room-${day}`,
      name: form.roomType.trim() || 'Standard Room',
      pricePerNight: perNight,
      images: imageDataUrl ? [imageDataUrl] : [],
    },
    mealPlan,
    perNight,
    totalCost: perNight,
    nights: 1,
  };
}

export default function ManualHotelEntry({ day, destination, value, onChange }) {
  const existing = value?.hotel?.isManual ? value : null;

  const [form, setForm] = useState({
    hotelId: existing?.hotel?.id || '',
    hotelName: existing?.hotel?.name || '',
    hotelCategory: existing?.hotel?.category || '4 Star',
    roomType: existing?.room?.name || '',
    mealPlan: existing?.mealPlan?.label || MEAL_PLANS[2] || 'MAP (Breakfast + Dinner)',
    pricePerNight: existing?.perNight ?? '',
  });
  const [imageDataUrl, setImageDataUrl] = useState(
    existing?.hotel?.thumbnailUrl || existing?.hotel?.images?.[0] || ''
  );
  const [imageMeta, setImageMeta] = useState(null);
  const [imageError, setImageError] = useState('');
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (value?.hotel?.isManual) {
      setForm({
        hotelId: value.hotel.id || '',
        hotelName: value.hotel.name || '',
        hotelCategory: value.hotel.category || '4 Star',
        roomType: value.room?.name || '',
        mealPlan: value.mealPlan?.label || MEAL_PLANS[2],
        pricePerNight: value.perNight ?? '',
      });
      setImageDataUrl(value.hotel.thumbnailUrl || value.hotel.images?.[0] || '');
    }
  }, [day, value?.hotel?.id]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleImagePick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setImageError('');
    try {
      const dataUrl = await readHotelImageFile(file);
      setImageDataUrl(dataUrl);
      setImageMeta({ name: file.name, size: file.size });
    } catch (err) {
      setImageError(err.message || 'Invalid image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageDataUrl('');
    setImageMeta(null);
    setImageError('');
  };

  const saveSelection = () => {
    if (!form.hotelName.trim()) {
      setFormError('Please enter hotel name');
      return;
    }
    if (!form.roomType.trim()) {
      setFormError('Please enter room type');
      return;
    }
    setFormError('');
    const selection = buildManualSelection({ day, destination, form, imageDataUrl });
    onChange(selection);
  };

  const isComplete = Boolean(form.hotelName.trim() && form.roomType.trim() && form.mealPlan);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-amber-400/40 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-amber-700" />
          <p className="text-sm font-bold text-content-primary">Enter hotel manually</p>
        </div>
        <p className="text-xs text-content-muted">
          Type hotel name, upload a photo (max 500 KB), room & meal details for Night {day}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase font-bold text-content-muted">Hotel Name *</label>
          <input
            type="text"
            value={form.hotelName}
            onChange={(e) => update('hotelName', e.target.value)}
            placeholder="e.g. Hotel Himalayan Queen"
            className="input-premium w-full h-10 rounded-xl text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-content-muted">Category</label>
          <select
            value={form.hotelCategory}
            onChange={(e) => update('hotelCategory', e.target.value)}
            className="input-premium w-full h-10 rounded-xl text-sm mt-1"
          >
            {HOTEL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-content-muted">Room Type *</label>
          <input
            type="text"
            value={form.roomType}
            onChange={(e) => update('roomType', e.target.value)}
            placeholder="e.g. Deluxe Mountain View"
            className="input-premium w-full h-10 rounded-xl text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-content-muted">Meal Plan *</label>
          <select
            value={form.mealPlan}
            onChange={(e) => update('mealPlan', e.target.value)}
            className="input-premium w-full h-10 rounded-xl text-sm mt-1"
          >
            {MEAL_PLANS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-content-muted">Price / Night (₹)</label>
          <input
            type="number"
            min={0}
            value={form.pricePerNight}
            onChange={(e) => update('pricePerNight', e.target.value)}
            placeholder="0"
            className="input-premium w-full h-10 rounded-xl text-sm mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase font-bold text-content-muted">Hotel Image (max 500 KB)</label>
        <div className="mt-2 flex flex-col sm:flex-row gap-3 items-start">
          <div
            className={cn(
              'w-full sm:w-40 h-32 rounded-xl border border-subtle overflow-hidden bg-surface-elevated flex items-center justify-center shrink-0',
              !imageDataUrl && 'border-dashed'
            )}
          >
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-content-muted p-3">
                <ImagePlus className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-[10px] mt-1">No image</p>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-subtle bg-white/80 hover:bg-white cursor-pointer text-sm font-medium transition-colors">
              <Upload className="w-4 h-4 text-sky-600" />
              {uploading ? 'Uploading…' : 'Upload image'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImagePick} disabled={uploading} />
            </label>
            <p className="text-[11px] text-content-muted">JPG, PNG or WebP · Maximum {formatImageSize(MAX_HOTEL_IMAGE_BYTES)}</p>
            {imageMeta && (
              <p className="text-[11px] text-emerald-700 font-medium">
                {imageMeta.name} · {formatImageSize(imageMeta.size)}
              </p>
            )}
            {imageDataUrl && (
              <button type="button" onClick={removeImage} className="text-xs text-red-600 hover:underline inline-flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Remove image
              </button>
            )}
            {imageError && <p className="text-xs text-red-600">{imageError}</p>}
            {formError && <p className="text-xs text-red-600">{formError}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-subtle">
        {isComplete && value?.hotel?.isManual && (
          <p className="text-xs text-emerald-700 font-medium">
            Saved: {value.hotel.name} · {formatINR(value.perNight || 0)}/night
          </p>
        )}
        <Button
          type="button"
          variant="amber"
          className="rounded-xl gap-2 ml-auto"
          disabled={!form.hotelName.trim() || !form.roomType.trim()}
          onClick={saveSelection}
        >
          Save for Night {day}
        </Button>
      </div>
    </div>
  );
}
