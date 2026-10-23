import { formatDate } from '@/lib/i18n/format';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppButton } from '../AppButton';
import { useLocalization } from '../LocalizationProvider';
import type { SharingClient } from '@/lib/workout-sharing/client';
import { colors, spacing, typography } from '@/lib/theme';
export function OwnedLinks({
  client,
  onRevoked,
}: {
  client: SharingClient;
  onRevoked?: (id: string) => void;
}) {
  const { t, locale } = useLocalization();
  const [links, setLinks] = useState<
    Awaited<ReturnType<SharingClient['owned']>>
  >([]);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    void client.owned().then(
      (values) => {
        if (alive) {
          setLinks(values);
          setError(false);
        }
      },
      () => {
        if (alive) setError(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [client, retry]);
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ ...typography.headline, color: colors.textPrimary }}>
        {t('sharing.activeLinks')}
      </Text>
      {error ? (
        <>
          <Text accessibilityRole="alert">{t('sharing.error')}</Text>
          <AppButton
            title={t('sharing.retry')}
            secondary
            onPress={() => setRetry((v) => v + 1)}
          />
        </>
      ) : null}
      {links.map((link) => (
        <View key={link.origin.publicationId}>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>
            {link.title}
          </Text>
          <Text style={{ ...typography.footnote, color: colors.textSecondary }}>
            {t('sharing.linkRef', {
              id: link.origin.publicationId.slice(0, 8),
              date:
                link.createdAt === undefined
                  ? ''
                  : formatDate(locale, link.createdAt, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
            })}
          </Text>
          <AppButton
            title={t('sharing.disable')}
            disabled={busy}
            destructive
            onPress={() => {
              if (busy) return;
              setBusy(true);
              void client
                .revoke(link.origin.publicationId)
                .then(
                  () => {
                    setLinks((v) =>
                      v.filter(
                        (item) =>
                          item.origin.publicationId !==
                          link.origin.publicationId,
                      ),
                    );
                    setError(false);
                    onRevoked?.(link.origin.publicationId);
                  },
                  () => setError(true),
                )
                .finally(() => setBusy(false));
            }}
          />
        </View>
      ))}
    </View>
  );
}
