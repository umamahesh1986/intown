/**
 * FALLBACK IMAGE
 * Used when:
 * - category index > available images
 * - image file is missing
 * - safety for future categories
 */
export const FALLBACK_CATEGORY_IMAGE = {
  uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/category/GroceriesAndKirana.jpg',
};

  
/**
 * CATEGORY IMAGE LIST
 * Order-based mapping
 *
 * Index 0  -> D1.jpg
 * Index 1  -> D2.jpg
 * ...
 * Index 79 -> D80.jpg
 *
 * If any image is missing OR
 * categories exceed images,
 * FALLBACK_CATEGORY_IMAGE will be used.
 */

export const CATEGORY_IMAGE_LIST = [
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/01-Groceries%26Kirana.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/02-BakerySweets%26Snacks.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/03-Dairy%26MilkProducts.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/04-Fruits%26Vegetables.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/05-MeatChicken%26FishShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/06-PharmacyMedicalStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/07-GeneralStoresProvisionStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/08-WaterCanSuppliers.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/09-MensSalons.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/10-WomensSalonsBeautyParlors.jpg'},

 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/11-Spa%26WellnessCenters.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/12-DryCleaning%26Laundry.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/13-Tailors%26StitchingServices.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/14-HomeCleaningServices.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/15-Restaurants.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/16-Cafes.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/17-IceCreamShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/18-JuiceShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/19-CloudKitchens.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/20-TakeawayCounters.jpg'},

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/21-Gyms.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/22-YogaFitnessStudios.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/23-DanceMusic%26ArtClasses.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/24-CoachingCentersAcademic.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/25-SkillDevelopmentInstitutes.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/26-PlaySchools%26DaycareCenters.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/27-MensClothingStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/28-WomensClothingStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/29-KidsWearStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/30-FootwearShops.jpg'},

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/31-Bags%26Accessories.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/32-EyewearOpticalStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/33-JewelleryStoresImitationFashion.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/34-JewelleryStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/35-MobileStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/36-Electronics%26HomeAppliances.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/37-Computer%26ITAccessoryShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/38-MobileRepair%26ServiceCenters.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/39-FurnitureStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/40-HomeD%C3%A9corStores.jpg'},

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/41-Mattress%26BeddingStores.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/42-HardwareShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/43-ElectricalShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/44-PaintShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/45-ModularKitchen%26Interiors.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/46-CarWashCarSpa.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/47-MechanicAutoServiceCenters.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/48-TyreShops.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/49-BatteryShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/50-BikeServiceCenters.jpg'},

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/51-PetStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/52-PetGrooming.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/53-VeterinaryClinics.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/54-Stationery%26BookStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/55-Gift%26FancyStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/56-Printing%26XeroxShops.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/57-PhotoStudios.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/58-Florists.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/59-GiftingCustomHampers.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/60-DiagnosticLabs.jpg'},

 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/61-AyurvedicStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/62-PhysiotherapyClinics.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/63-OrganicStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/64-OthersEmergingCategories.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/65-Plumbers.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/66-PestControlServices.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/67-ApplianceRepairNonMobile.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/68-CleaningJanitorialServicesCommercial.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/69-Locksmiths.png'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/70-SecuritySystemInstallationServices.png'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/71-FinancialServicesLocalAgents.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/72-RealEstateAgents%26Brokers.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/73-LegalServices%26Advocates.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/74-DentalClinics.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/75-Optometrists%26EyeDoctors.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/76Caterers.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/77-TravelAgents.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/78-ToyStores%26HobbyShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/79-BoutiqueDesignerStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Categories_Images/Categories_Images/80-EventManagementServices.jpg'},
];


