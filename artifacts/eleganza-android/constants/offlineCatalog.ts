import type { StorefrontProduct } from '@workspace/api-client-react';

// Snapshot of the active storefront catalog so a fresh install can show
// products immediately, even before the first successful API request.
export const offlineStorefrontCatalog: StorefrontProduct[] = [
  { id: 13, sku: '111', nameEn: 'nice', nameAr: 'جميل', category: 'accessories', descriptionEn: 'very nice ', descriptionAr: 'جميل جدا', imageUrls: ['https://i.ibb.co/JW48Xv2d/5e60a0e6-1a89-43dd-bb15-452eb64d0d47-thumbnail-1000x1000-70.jpg'], audience: 'men', salePriceMinor: 6500, quantityOnHand: 7 },
  { id: 12, sku: 'm06', nameEn: 'Plum Élan', nameAr: '', category: 'Makeup', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 3800, quantityOnHand: 9 },
  { id: 11, sku: 'a03', nameEn: 'Aurelia Drops', nameAr: '', category: 'Accessories', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 10500, quantityOnHand: 10 },
  { id: 10, sku: 'm05', nameEn: 'Dawn Flush', nameAr: '', category: 'Makeup', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 4600, quantityOnHand: 10 },
  { id: 9, sku: 'p03', nameEn: 'Cedar Afterglow', nameAr: '', category: 'Perfume', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 15200, quantityOnHand: 10 },
  { id: 8, sku: 'm04', nameEn: 'Nocturne Rouge', nameAr: '', category: 'Makeup', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 3900, quantityOnHand: 7 },
  { id: 7, sku: 'a02', nameEn: 'Solstice Chain', nameAr: '', category: 'Accessories', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 11800, quantityOnHand: 10 },
  { id: 6, sku: 'm03', nameEn: 'Silk Petal', nameAr: '', category: 'Makeup', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 4400, quantityOnHand: 9 },
  { id: 5, sku: 'p02', nameEn: 'Amber Reverie', nameAr: '', category: 'Perfume', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 16800, quantityOnHand: 8 },
  { id: 4, sku: 'm02', nameEn: 'Velvet Muse', nameAr: '', category: 'Makeup', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 3600, quantityOnHand: 9 },
  { id: 3, sku: 'a01', nameEn: 'Lune Hoops', nameAr: '', category: 'Accessories', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 9200, quantityOnHand: 9 },
  { id: 2, sku: 'm01', nameEn: 'Rose Veil', nameAr: '', category: 'Makeup', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 4800, quantityOnHand: 28 },
  { id: 1, sku: 'p01', nameEn: 'Santal No. 03', nameAr: '', category: 'Perfume', descriptionEn: null, descriptionAr: null, imageUrls: [], audience: 'women', salePriceMinor: 14500, quantityOnHand: 10 },
];
