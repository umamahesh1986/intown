/**
 * FALLBACK IMAGE
 * Used when:
 * - category index > available images
 * - image file is missing
 * - safety for future categories
 */
export const FALLBACK_CATEGORY_IMAGE = {
  uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/GroceriesAndKirana.png',
};


/**
 * CATEGORY IMAGE LIST
 * Order-based mapping
 *
 * Index 0  -> D1.png
 * Index 1  -> D2.png
 * ...
 * Index 79 -> D80.png
 *
 * If any image is missing OR
 * categories exceed images,
 * FALLBACK_CATEGORY_IMAGE will be used.
 */

export const CATEGORY_IMAGE_LIST = [
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/01-Groceries%26Kirana.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/02-BakerySweets%26Snacks.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/03-Dairy%26MilkProducts.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/04-Fruits%26Vegetables.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/05-MeatChicken%26FishShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/06-PharmacyMedicalStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/07-GeneralStoresProvisionStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/08-Water+CanSuppliers.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/09-MensSalons.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/10-WomensSalonsBeautyParlors.png' },

  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/11-Spa%26WellnessCenters.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/12-DryCleaning%26Laundry.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/13-Tailors%26StitchingServices.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/14-HomeCleaningServices.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/15-Restaurants.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/16-Cafes.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/17-IceCreamShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/18-JuiceShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/19-CloudKitchens.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/20-TakeawayCounters.png' },

  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/21-Gyms.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/22-YogaFitness+Studios.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/23-DanceMusic%26ArtClasses.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/24-CoachingCentersAcademic.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/25-SkillDevelopmentInstitutes.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/26-PlaySchools%26DaycareCenters.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/27-MensClothingStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/28-WomensClothingStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/29-KidsWear+Stores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/30-FootwearShops.png' },

  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/31-Bags%26Accessories.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/32-EyewearOpticalStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/33-JewelleryStoresImitationFashion.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/34-JewelleryStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/35-MobileStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/36-Electronics%26+HomeAppliances.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/37-Computer%26ITAccessoryShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/38-MobileRepair%26ServiceCenters.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/39-FurnitureStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/40-HomeD%C3%A9corStores.png' },

  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/41-Mattress%26BeddingStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/42-HardwareShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/43-ElectricalShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/44-PaintShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/45-ModularKitchen%26Interiors.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/46-CarWash+CarSpa.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/47-Mechanic+AutoServiceCenters.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/48-TyreShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/49-BatteryShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/50-BikeService+Centers.png' },

  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/51-PetStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/52-PetGrooming.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/53-VeterinaryClinics.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/54-Stationery%26+BookStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/55-Gift%26FancyStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/56-Printing%26+XeroxShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/57-PhotoStudios.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/58-Florists.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/59-Gifting+CustomHampers.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/60-DiagnosticLabs.png' },

  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/61-Ayurvedic+Stores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/62-Physiotherapy+Clinics.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/63-OrganicStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/64-OthersEmerging+Categories.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/65-Plumbers.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/66-PestControl+Services.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/67-Appliance+RepairNonMobile.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/68-Cleaning+JanitorialServicesCommercial.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/69-Locksmiths.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/70-SecuritySystemInstallationServices.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/71-FinancialServicesLocalAgents.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/72-RealEstate+Agents%26+Brokers.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/73-LegalServices%26Advocates.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/74-DentalClinics.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/75-Optometrists%26EyeDoctors.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/76Caterers.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/77-TravelAgents.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/78-ToyStores%26HobbyShops.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/79-BoutiqueDesignerStores.png' },
  { uri: 'https://intown-prod.s3.ap-south-1.amazonaws.com/category/80-EventManagementServices.png' },
];


