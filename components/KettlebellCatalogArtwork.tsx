import { Image, View } from 'react-native';
import { useBrandingRelease } from '@/lib/use-branding-release';
import { BrandWordmark } from './BrandWordmark';

export function KettlebellCatalogArtwork({ size }: { size: number }) {
  const branding = useBrandingRelease();
  const release = branding?.release;
  const custom = release?.mode === 'custom' ? release.layout : null;
  const markWidth = (size * (custom?.width ?? 41)) / 100;
  const markHeight = markWidth * (custom ? 16 / 41 : 24 / 182);
  const showMark = release?.mode !== 'disabled' && markWidth > 0;

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Image
        source={require('../assets/equipment/kettlebell.webp')}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      {showMark ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            left: (size * (custom?.x ?? 50)) / 100 - markWidth / 2,
            top: (size * (custom?.y ?? 66)) / 100 - markHeight / 2,
          }}
        >
          {custom && branding?.logo ? (
            <Image
              source={{ uri: branding.logo }}
              resizeMode="contain"
              style={{ width: markWidth, height: markHeight }}
            />
          ) : (
            <BrandWordmark
              width={markWidth}
              height={markHeight}
              color="#D0D2D4"
            />
          )}
        </View>
      ) : null}
    </View>
  );
}
