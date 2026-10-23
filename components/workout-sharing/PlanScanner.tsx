import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppButton } from '../AppButton';
import { useLocalization } from '../LocalizationProvider';
import { colors, spacing, typography } from '@/lib/theme';
export function PlanScanner({
  onRead,
  onClose,
}: {
  onRead: (url: string) => void;
  onClose: () => void;
}) {
  const { t } = useLocalization();
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);
  return (
    <View style={s.root}>
      {permission?.granted ? (
        <CameraView
          style={s.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            if (scanned.current) return;
            scanned.current = true;
            onRead(data);
          }}
        />
      ) : (
        <>
          <Text style={s.copy}>{t('sharing.permission')}</Text>
          <AppButton
            title={t('sharing.allow')}
            disabled={permission?.canAskAgain === false}
            onPress={() => void requestPermission()}
          />
        </>
      )}
      <AppButton secondary title={t('sharing.back')} onPress={onClose} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.md },
  camera: { height: 320 },
  copy: { ...typography.body, color: colors.textPrimary },
});
