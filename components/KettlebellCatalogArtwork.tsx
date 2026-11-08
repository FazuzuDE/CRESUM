import { Image, View } from 'react-native';
import { BrandWordmark } from './BrandWordmark';

export function KettlebellCatalogArtwork({ size }: { size: number }) {
  const markWidth = size * 0.41;
  const markHeight = (markWidth * 24) / 182;

  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={require('../assets/equipment/kettlebell.webp')}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (size - markWidth) / 2,
          top: size * 0.66 - markHeight / 2,
        }}
      >
        <BrandWordmark
          width={markWidth}
          height={markHeight}
          color="#D0D2D4"
          decorative
        />
      </View>
    </View>
  );
}
