/**
 * Mock Karma Blacklist Configuration
 *
 * Deterministic sentinel identities used when ADJUTOR_MODE=mock.
 * Assessors can copy/paste these into Swagger to verify both
 * rejected (blacklisted) and accepted (clean) flows.
 *
 * IMPORTANT:
 * - Emails are matched case-insensitively
 * - Phones are normalized by stripping spaces and dashes
 * - BVNs are matched as exact 11-digit strings
 */
export const mockKarma = {
	// BVN sentinels (11 digits each)
	bvns: [
		"12345678901",
		"11122233344",
		"22233344455",
		"33344455566",
	] as string[],
	// Email sentinels (case-insensitive match)
	emails: [
		"blacklisted@adjutor.test",
		"fraudster@adjutor.test",
		"defaulted@adjutor.test",
	] as string[],
	// Phone sentinels (normalize by removing spaces/dashes)
	phones: [
		"+2341234567890",
		"+2348000000001",
		"+2348000000002",
	] as string[],
};

/**
 * Utility: normalize email for comparison
 */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Utility: normalize phone for comparison (strip spaces and dashes)
 */
export function normalizePhone(phone: string): string {
	return phone.replace(/[\s-]/g, "");
}

/**
 * Utility: test membership of an identity within the mock list
 */
export function isInMockKarma(
	identity: string,
	type: "bvn" | "email" | "phone"
): boolean {
	if (type === "bvn") {
		return mockKarma.bvns.includes(identity.trim());
	}
	if (type === "email") {
		const val = normalizeEmail(identity);
		return mockKarma.emails.map(normalizeEmail).includes(val);
	}
	const normalized = normalizePhone(identity);
	return mockKarma.phones.map(normalizePhone).includes(normalized);
}


