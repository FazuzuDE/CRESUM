import { OwnedLinks } from './OwnedLinks';
import { useRef, useState } from 'react';
import { Share, Switch, Text, View, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path, Rect } from 'react-native-svg';
import createQr from 'qrcode-generator';
import { AppButton } from '../AppButton';
import { useLocalization } from '../LocalizationProvider';
import type { WorkoutTemplate } from '@/lib/workout-model';
import type {
  SharingClient,
  PublishedPlan,
} from '@/lib/workout-sharing/client';
import { exportSharedPlan } from '@/lib/workout-sharing/adapter';
import { EquipmentSharingUnavailable } from '@/lib/workout-sharing/client';
import { colors, spacing, typography } from '@/lib/theme';
function PlanQR({ url, label }: { url: string; label: string }) {
  const qr = createQr(0, 'M');
  qr.addData(url, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  let path = '';
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (qr.isDark(y, x)) path += `M${x + 4},${y + 4}h1v1h-1z`;
  return (
    <Svg
      width="100%"
      height={240}
      viewBox={`0 0 ${n + 8} ${n + 8}`}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Rect width={n + 8} height={n + 8} fill={colors.surface} />
      <Path d={path} fill={colors.textPrimary} />
    </Svg>
  );
}
export function SharePlanSheet({
  template,
  client,
  signedIn,
}: {
  template: WorkoutTemplate;
  client: SharingClient | null;
  signedIn: boolean;
}) {
  const { t } = useLocalization();
  const [weights, setWeights] = useState(false);
  const [published, setPublished] = useState<PublishedPlan | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [equipmentPending, setEquipmentPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const flight = useRef(false);
  const run = async (work: () => Promise<void>) => {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError(false);
    setEquipmentPending(false);
    try {
      await work();
    } catch (cause) {
      setEquipmentPending(cause instanceof EquipmentSharingUnavailable);
      setError(true);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={s.content}>
      <Text style={s.title}>{t('sharing.share')}</Text>
      <Text style={s.name}>{template.name}</Text>
      <Text style={s.copy}>{t('sharing.linkAccess')}</Text>
      <Text style={s.copy}>{t('sharing.snapshot')}</Text>
      {!client ? (
        <Text style={s.copy}>{t('sharing.unconfigured')}</Text>
      ) : !signedIn ? (
        <Text style={s.copy}>{t('sharing.signIn')}</Text>
      ) : (
        <>
          <View style={s.row}>
            <Text style={s.copy}>{t('sharing.weights')}</Text>
            <Switch
              accessibilityLabel={t('sharing.weights')}
              value={weights}
              disabled={busy}
              onValueChange={(value) => {
                setWeights(value);
                setPublished(null);
                setDisabled(false);
                setCopied(false);
              }}
            />
          </View>
          {published && !disabled ? (
            <>
              <PlanQR url={published.url} label={t('sharing.qr')} />
              <Text style={s.copy}>
                {t('sharing.linkRef', {
                  id: published.origin.publicationId.slice(0, 8),
                  date: '',
                })}
              </Text>
              <AppButton
                title={t('sharing.send')}
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await Share.share({ message: published.url });
                  })
                }
              />
              <AppButton
                title={t(copied ? 'sharing.copied' : 'sharing.copyLink')}
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await Clipboard.setStringAsync(published.url);
                    setCopied(true);
                  })
                }
                secondary
              />
              <AppButton
                title={t('sharing.disable')}
                disabled={busy}
                destructive
                onPress={() =>
                  void run(async () => {
                    await client.revoke(published.origin.publicationId);
                    setDisabled(true);
                  })
                }
              />
            </>
          ) : (
            <AppButton
              title={t('sharing.publish')}
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  setPublished(
                    await client.publish(exportSharedPlan(template, weights)),
                  );
                  setDisabled(false);
                  setCopied(false);
                })
              }
            />
          )}
          {disabled ? (
            <Text style={s.copy}>{t('sharing.disabled')}</Text>
          ) : null}
        </>
      )}
      {client && signedIn ? (
        <OwnedLinks
          key={published?.url + String(disabled)}
          client={client}
          onRevoked={(id) => {
            if (id === published?.origin.publicationId) setDisabled(true);
          }}
        />
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.copy}>
          {equipmentPending ? t('equipment.sharePending') : t('sharing.error')}
        </Text>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  content: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.title1, color: colors.textPrimary },
  name: { ...typography.headline, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary, flexShrink: 1 },
});
