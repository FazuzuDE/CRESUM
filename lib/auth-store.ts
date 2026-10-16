import { HistoryProtocolError } from './sync/history-rpc';
import type { AuthIdentity, AuthRepository } from './auth-repository';
import type {
  AccountDeletionRepository,
  DeletionStatus,
} from './account-deletion';

export type AuthSnapshot = {
  status: 'initializing' | 'signed_out' | 'signed_in' | 'error';
  configured: boolean;
  identity: AuthIdentity | null;
  error: string | null;
  busy: 'send' | 'verify' | 'sign_out' | 'delete' | null;
  deletion?: { userId: string; status: DeletionStatus };
  notice?: string;
};

export class AuthActionError extends Error {}

function safeError(
  action: 'send' | 'verify' | 'sign_out',
  cause?: unknown,
): string {
  const details =
    cause && typeof cause === 'object'
      ? (cause as { status?: unknown; code?: unknown; name?: unknown })
      : null;
  if (details?.status === 429 || details?.code === 'over_request_rate_limit')
    return 'Too many requests. Please wait before trying again.';
  if (
    details?.name === 'AuthRetryableFetchError' ||
    details?.name === 'TypeError' ||
    (typeof details?.status === 'number' && details.status >= 500)
  )
    return 'Could not connect to sign-in service. Check your connection and try again.';
  if (action === 'verify')
    return 'Code invalid or expired. Try again or resend it.';
  if (action === 'send') return 'Could not send the code. Try again.';
  return 'Could not sign out. Check your connection and try again.';
}

export class AuthStore {
  private snapshot: AuthSnapshot;
  private listeners = new Set<() => void>();
  private unsubscribe: (() => void) | null = null;
  private disposed = false;
  private revision = 0;
  private signedOutDuringRequest = false;
  private repository: AuthRepository | null;
  private factoryResolved = false;
  private ownerEpoch = 0;
  private confirmedHere = new Set<string>();

  constructor(
    private readonly source:
      AuthRepository | null | (() => AuthRepository | null),
    private readonly deletion?: AccountDeletionRepository,
  ) {
    this.repository = typeof source === 'function' ? null : source;
    this.snapshot = {
      status: source ? 'initializing' : 'signed_out',
      configured: !!this.repository,
      identity: null,
      error: null,
      busy: null,
    };
  }

  hasHistoryRpc = (): boolean => !!this.repository?.historyRpc;
  hasAccountDeletion = (): boolean =>
    !!this.deletion &&
    !!this.repository?.clearDeletedSession &&
    (!!this.repository.deleteAccount ||
      this.snapshot.deletion?.status === 'confirmed');
  isCurrentAccount = (userId: string): boolean =>
    !this.disposed &&
    this.snapshot.status === 'signed_in' &&
    this.snapshot.identity?.id === userId &&
    this.snapshot.busy !== 'sign_out' &&
    this.snapshot.busy !== 'delete' &&
    !this.confirmedHere.has(userId) &&
    !this.deletion?.blocked(userId);
  historyRpc = async (
    userId: string,
    name: string,
    args: Record<string, unknown>,
  ) => {
    if (!this.isCurrentAccount(userId) || !this.repository?.historyRpc)
      throw new HistoryProtocolError('auth');
    return this.repository.historyRpc(userId, name, args);
  };

  getSnapshot = (): AuthSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(next: AuthSnapshot): void {
    if (this.disposed) return;
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  async initialize(): Promise<void> {
    if (this.disposed) return;
    if (this.deletion) {
      try {
        await this.deletion.load();
        if (this.disposed) return;
      } catch {
        this.publish({
          ...this.snapshot,
          status: 'error',
          error:
            'Account recovery metadata could not be verified. Retry account setup. Local workouts remain available.',
        });
        return;
      }
    }
    if (typeof this.source === 'function' && !this.factoryResolved) {
      this.factoryResolved = true;
      try {
        this.repository = this.source();
      } catch {
        this.publish({
          ...this.snapshot,
          status: 'error',
          error:
            'Account setup is unavailable. Local workouts remain available.',
        });
        return;
      }
      this.publish({
        ...this.snapshot,
        configured: !!this.repository,
        status: this.repository ? 'initializing' : 'signed_out',
      });
    }
    if (!this.repository) return;
    if (!this.unsubscribe) {
      this.unsubscribe = this.repository.onAuthChange((identity) => {
        if (this.disposed) return;
        if (
          identity &&
          (this.confirmedHere.has(identity.id) ||
            this.deletion?.state(identity.id) === 'confirmed')
        )
          return;
        if (this.snapshot.busy === 'sign_out') {
          if (!identity) this.signedOutDuringRequest = true;
          return;
        }
        this.revision++;
        if (identity?.id !== this.snapshot.identity?.id) this.ownerEpoch++;
        const state = identity && this.deletion?.state(identity.id);
        this.publish({
          ...this.snapshot,
          status: identity ? 'signed_in' : 'signed_out',
          identity,
          error: null,
          notice: undefined,
          deletion: identity
            ? state
              ? { userId: identity.id, status: state }
              : undefined
            : this.snapshot.deletion,
        });
      });
    }
    const revision = this.revision;
    try {
      let identity = await this.repository.getIdentity();
      if (
        identity &&
        (this.confirmedHere.has(identity.id) ||
          this.deletion?.state(identity.id) === 'confirmed')
      )
        identity = null;
      if (this.revision === revision) {
        const state = identity && this.deletion?.state(identity.id);
        this.publish({
          ...this.snapshot,
          status: identity ? 'signed_in' : 'signed_out',
          identity,
          error: null,
          deletion:
            identity && state
              ? { userId: identity.id, status: state }
              : undefined,
        });
      }
    } catch {
      if (this.revision === revision) {
        this.publish({
          ...this.snapshot,
          status: 'error',
          error:
            'Could not restore account session. Local workouts remain available.',
        });
      }
    }
  }

  async sendEmailOtp(email: string): Promise<void> {
    if (!this.repository || this.snapshot.busy || this.disposed) return;
    this.publish({ ...this.snapshot, busy: 'send', error: null });
    try {
      await this.repository.sendEmailOtp(email);
      this.publish({ ...this.snapshot, busy: null, error: null });
    } catch (cause) {
      const message = safeError('send', cause);
      this.publish({ ...this.snapshot, busy: null, error: message });
      throw new AuthActionError(message);
    }
  }

  async verifyEmailOtp(email: string, code: string): Promise<void> {
    if (!this.repository || this.snapshot.busy || this.disposed) return;
    this.publish({ ...this.snapshot, busy: 'verify', error: null });
    const revision = this.revision;
    try {
      const identity = await this.repository.verifyEmailOtp(email, code);
      if (
        this.revision !== revision &&
        this.snapshot.identity?.id !== identity.id
      ) {
        this.publish({ ...this.snapshot, busy: null });
        return;
      }
      this.revision++;
      this.publish({
        ...this.snapshot,
        status: 'signed_in',
        identity,
        busy: null,
        error: null,
      });
    } catch (cause) {
      const message = safeError('verify', cause);
      this.publish({ ...this.snapshot, busy: null, error: message });
      throw new AuthActionError(message);
    }
  }

  async signOut(): Promise<void> {
    if (!this.repository || this.snapshot.busy || this.disposed) return;
    this.signedOutDuringRequest = false;
    this.revision++;
    this.publish({ ...this.snapshot, busy: 'sign_out', error: null });
    try {
      await this.repository.signOut();
      this.revision++;
      this.publish({
        ...this.snapshot,
        status: 'signed_out',
        identity: null,
        busy: null,
        error: null,
      });
    } catch {
      const message = this.signedOutDuringRequest
        ? 'Sign out completed on this device, but could not confirm it on other devices.'
        : safeError('sign_out');
      this.publish({
        ...this.snapshot,
        status: this.signedOutDuringRequest
          ? 'signed_out'
          : this.snapshot.status,
        identity: this.signedOutDuringRequest ? null : this.snapshot.identity,
        busy: null,
        error: message,
      });
      throw new AuthActionError(message);
    }
  }

  deleteAccount = async (
    userId: string,
    prepare?: () => Promise<() => void>,
  ): Promise<void> => {
    const repository = this.repository,
      deletion = this.deletion;
    if (
      !repository?.clearDeletedSession ||
      !deletion ||
      this.disposed ||
      this.snapshot.busy
    )
      throw new AuthActionError('Account deletion is unavailable.');
    let confirmed =
      this.confirmedHere.has(userId) || deletion.state(userId) === 'confirmed';
    if (
      !confirmed &&
      (!repository.deleteAccount ||
        !prepare ||
        this.snapshot.status !== 'signed_in' ||
        this.snapshot.identity?.id !== userId)
    )
      throw new AuthActionError(
        'Sign in to the same account before retrying deletion.',
      );
    const epoch = this.ownerEpoch;
    this.revision++;
    this.publish({
      ...this.snapshot,
      busy: 'delete',
      error: null,
      notice: undefined,
    });
    let release: (() => void) | undefined;
    try {
      if (!confirmed) {
        await deletion.pending(userId);
        if (this.snapshot.identity?.id === userId)
          this.publish({
            ...this.snapshot,
            deletion: { userId, status: 'pending' },
          });
        release = await prepare!();
        if (
          this.disposed ||
          this.ownerEpoch !== epoch ||
          this.snapshot.identity?.id !== userId
        )
          throw new Error('Account changed');
        await repository.deleteAccount!(userId);
        confirmed = true;
        this.confirmedHere.add(userId);
      }
      await deletion.confirmed(userId);
      await repository.clearDeletedSession(userId);
      const other =
        this.snapshot.identity && this.snapshot.identity.id !== userId;
      this.publish(
        other
          ? { ...this.snapshot, busy: null }
          : {
              ...this.snapshot,
              status: 'signed_out',
              identity: null,
              busy: null,
              deletion: undefined,
              error: null,
              notice:
                'Account deleted. Your local workouts and saved backup files are kept.',
            },
      );
    } catch {
      const message = confirmed
        ? 'Account deletion was confirmed, but local session cleanup is incomplete. Retry cleanup. Your local workouts are kept.'
        : 'Account deletion is not confirmed. Cloud backup stays paused. Retry deletion or keep using local workouts.';
      const other =
        this.snapshot.identity && this.snapshot.identity.id !== userId;
      this.publish(
        other
          ? { ...this.snapshot, busy: null }
          : {
              ...this.snapshot,
              busy: null,
              error: message,
              status: confirmed ? 'signed_out' : this.snapshot.status,
              identity: confirmed ? null : this.snapshot.identity,
              deletion: { userId, status: confirmed ? 'confirmed' : 'pending' },
            },
      );
      throw new AuthActionError(message);
    } finally {
      release?.();
    }
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe?.();
    this.repository?.dispose();
    this.listeners.clear();
  }
}
