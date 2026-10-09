const TAGLINES: Record<string, string> = {
  grocery: 'Trusted Neighborhood Provision & Essentials',
  groceries: 'Trusted Neighborhood Provision & Essentials',
  kirana: 'Trusted Neighborhood Provision & Essentials',
  pharmacy: 'Medicines & Healthcare Essentials',
  medical: 'Medicines & Healthcare Essentials',
  restaurant: 'Fresh Meals & Local Flavours',
  bakery: 'Freshly Baked Breads & Treats',
  salon: 'Grooming & Beauty Services',
  electronics: 'Gadgets, Appliances & Repairs',
  dairy: 'Fresh Dairy, Every Day',
  meat: 'Fresh Cuts & Quality Meat',
  stationery: 'Books, Stationery & Supplies',
  bags: 'Bags, Accessories & Everyday Carry',
  fruits: 'Farm-fresh Fruits & Vegetables',
  vegetables: 'Farm-fresh Fruits & Vegetables',
  cafe: 'Coffee, Snacks & Good Vibes',
};

export const getShopTagline = (category?: string | null): string => {
  const raw = (category ?? '').trim();
  if (!raw) return 'Your trusted local store';
  const key = raw.toLowerCase().split(/[\s&,/]+/)[0];
  return TAGLINES[key] ?? `Your trusted local ${raw.toLowerCase()} store`;
};
