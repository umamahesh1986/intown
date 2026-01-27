/**
 * FALLBACK IMAGE
 * Used when:
 * - category index > available images
 * - image file is missing
 * - safety for future categories
 */
export const FALLBACK_CATEGORY_IMAGE = {
  uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/category/default.jpg',
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
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/GroceriesAndKirana.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/BakerySweetsAndSnacks.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/DairyAndMilkProducts.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/FruitsAndVegetables.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/MeatAndFishShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/MedicalStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/GeneralStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/WaterCanSuppliers.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/MensSaloons.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/WomenBeautyParlours.jpg'},

 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/SpaAndWellnessCenters.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/DryCleaningAndLaundry.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/TailorsAndStitchingShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/HomeCleaningServices.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Restaurants.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Cafes.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/IceCreamParlour.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/JuiceShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/CloudKitchen.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/TakeAwayCounters.jpg'},

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Gyms.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/YogaAndFitnessStudios.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/DanceMusicAndArtClasses.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/AcademicCoachingCenters.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/SkillDevelopmentInstitutes.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/PlaySchoolsAndDayCareCenters.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/MensClothingStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/WomensClothingStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/KidsClothingStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/FootwearShops.jpg'},

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/BagsAndAccesories.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/EyewearOrOpticalStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/ImitationOrFashionJewellaryStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/JewellaryStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/MobileStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/ElectronicsAndHomeAppliances.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/ComputerAccessoryStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/MobileRepairAndServiceCenters.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/FurnitureStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/HomeDecorStores.jpg'},

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/MatressAndBeddingStores.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/HardwareShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/ElectricalShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/PaintShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/ModularKitchenAndInteriors.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/CarWash.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/MechanicOrAutoServiceCenters.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/TyreShops.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/BatteryShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/BikeServiceCenters.jpg'},

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/PetStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/PetGrooming.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/VeternaryClinics.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/StationaryAndBookStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/GiftAndFancyStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/XeroxAndPrintingShops.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/PhotoStudios.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Florists.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/GiftingOrCustomHampers.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/DiagnosticLabs.jpg'},

 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/AyurvedicStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/PhysiotherapyClinics.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/OrganicStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/EmergingOrOtherCategories.jpg'},
  FALLBACK_CATEGORY_IMAGE, // D65 missing → fallback
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/PestControlServices.jpg'},
 {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/ApplianceRepairNon-Mobile.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/CleaningOrJanitorialServices.jpg'},
  FALLBACK_CATEGORY_IMAGE, // D69 missing → fallback
FALLBACK_CATEGORY_IMAGE, // D70 missing → fallback

//   require('../assets/images/category-images/D69.jpg'),
//   require('../assets/images/category-images/D70.jpg'),

  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/FinancialServices.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/RealEstateAgents.jpg'},
{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/AdvocatesOrLegalServices.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/DentalClinics.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/OptometristsOrEyeDoctors.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/Caterors.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/TravelAgents.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/ToyStoresOrHobbyShops.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/BoutiqueOrDesignerStores.jpg'},
  {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/category/EventManagementServices.jpg'},
];


