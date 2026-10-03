export const vendorServices = [
  "Photography",
  "Videography",
  "Wedding planning",
  "Venue",
  "Catering",
  "Cake",
  "Florist",
  "Decor",
  "Music & DJ",
  "Live entertainment",
  "Hair & makeup",
  "Wedding attire",
  "Stationery",
  "Transport",
  "Accommodation",
  "Celebrant",
  "Jewellery",
  "Rentals",
] as const;

export type VendorService = (typeof vendorServices)[number];

export function isVendorService(value: string): value is VendorService {
  return vendorServices.includes(value as VendorService);
}
