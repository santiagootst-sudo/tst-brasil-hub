export type CertificateExpiryRecord = {
  companyId: number | null;
  expiresAt: Date | null;
};

export function certificateExpirySummary(records: CertificateExpiryRecord[], companyId: number, referenceAt = new Date()) {
  const certificates = records.filter(item => item.companyId === companyId && item.expiresAt);
  const referenceTime = referenceAt.getTime();
  const deadline = referenceTime + 30 * 86_400_000;
  const expired = certificates.filter(item => item.expiresAt && item.expiresAt.getTime() < referenceTime).length;
  const expiring = certificates.filter(item => item.expiresAt && item.expiresAt.getTime() >= referenceTime && item.expiresAt.getTime() <= deadline).length;
  return { total: certificates.length, expired, expiring };
}
