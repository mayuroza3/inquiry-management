export interface AccessGrant {
  expires: number;
  signature: string;
}

export function withAccess(path: string, access?: AccessGrant | null): string {
  if (!access) {
    return path;
  }

  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}expires=${access.expires}&signature=${encodeURIComponent(access.signature)}`;
}

export function inquiryHref(inquiry: { id: number; access?: AccessGrant | null }, hash = ''): string {
  return `${withAccess(`/admin/inquiries/${inquiry.id}`, inquiry.access)}${hash}`;
}
