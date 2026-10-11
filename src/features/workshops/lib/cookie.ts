// Remembers, per browser and per workshop, which response unlocked the
// certificate — lets a returning student skip the closed form and re-download.
export const workshopCookieName = (workshopId: string) => `ws_${workshopId}`;
