#import <Foundation/Foundation.h>
#import <StoreKit/StoreKit.h>
#import <React/RCTBridgeModule.h>

@interface Storefront : NSObject <RCTBridgeModule>
@end

@implementation Storefront
RCT_EXPORT_MODULE();
RCT_EXPORT_METHOD(country:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
    NSString *alpha3 = [SKPaymentQueue defaultQueue].storefront.countryCode;
    resolve(alpha3);
  });
}
@end
