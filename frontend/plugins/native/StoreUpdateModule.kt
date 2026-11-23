package com.intown.andriod

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.model.UpdateAvailability

class StoreUpdateModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "StoreUpdate"

  @ReactMethod
  fun check(promise: Promise) {
    AppUpdateManagerFactory.create(reactApplicationContext).appUpdateInfo
      .addOnSuccessListener { info -> promise.resolve(info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) }
      .addOnFailureListener { error -> promise.reject("PLAY_UPDATE_CHECK", error) }
  }
}
