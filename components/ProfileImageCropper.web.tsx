import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';

type Props = {
  image: string;
  onCancel: () => void;
  onConfirm: (croppedImage: string) => void;
};

export default function ProfileImageCropper({
  image,
  onCancel,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback(
    (
      _croppedArea: unknown,
      croppedAreaPixels: {
        x: number;
        y: number;
        width: number;
        height: number;
      },
    ) => {
      setArea(croppedAreaPixels);
    },
    [],
  );

  const confirmCrop = async () => {
    if (!area || saving) return;

    setSaving(true);

    try {
      const source = new window.Image();
      source.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        source.onload = () => resolve();
        source.onerror = () => reject(new Error('Unable to load this image.'));
        source.src = image;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to crop this image.');
      }

      context.drawImage(
        source,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        512,
        512,
      );

      onConfirm(canvas.toDataURL('image/jpeg', 0.85));
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Unable to crop this image.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 20,
          padding: 22,
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h2 style={{ margin: '0 0 6px', color: '#0f172a' }}>
          Crop Profile Picture
        </h2>

        <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: 14 }}>
          Move and zoom your picture to fit the circle.
        </p>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 320,
            background: '#111827',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label
          style={{
            display: 'block',
            marginTop: 18,
            marginBottom: 8,
            color: '#334155',
            fontSize: 14,
          }}
        >
          Zoom
        </label>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          style={{ width: '100%' }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => void confirmCrop()}
            disabled={saving || !area}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 12,
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: saving || !area ? 0.6 : 1,
            }}
          >
            {saving ? 'Preparing...' : 'Confirm Crop'}
          </button>
        </div>
      </div>
    </div>
  );
}
