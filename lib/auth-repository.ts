export type AuthIdentity = { id: string; email: string | null };

export type AuthRepository = {
  invokeSharedPlan?(
    userId: string,
    method: 'POST' | 'DELETE',
    body: unknown,
  ): Promise<unknown>;
  deleteAccount?(userId: string): Promise<void>;
  clearDeletedSession?(userId: string): Promise<void>;
  historyRpc?(
    userId: string,
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ data: unknown; error: unknown }>;
  getIdentity(): Promise<AuthIdentity | null>;
  onAuthChange(listener: (identity: AuthIdentity | null) => void): () => void;
  sendEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(email: string, code: string): Promise<AuthIdentity>;
  signOut(): Promise<void>;
  dispose(): void;
};
