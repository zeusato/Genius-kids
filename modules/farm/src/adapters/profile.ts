/** Host profiles have independent guest saves. Standalone and cloud names stay unchanged. */
export function profileFarmDatabase(profileId: string) {
    if (!profileId) throw new Error('Thiếu hồ sơ để mở nông trại.');
    return `lang-mam-profile-v1-${encodeURIComponent(profileId)}`;
}
