package com.hwtransportreactnativeble

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.ledger.live.ble.BleManager


class HwTransportReactNativeBleModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    var context: ReactApplicationContext = reactContext
    var bleManager = BleManager.Companion.getInstance(context)
    var jsAwake = true

    override fun getName(): String {
        return "HwTransportReactNativeBle"
    }

    private fun sendEvent(reactContext: ReactContext, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("BleTransport", params)
    }

    @ReactMethod
    fun observeBluetooth() {
        // TODO, need to know when bluetooth starts/stops being available
    }

    @ReactMethod
    fun listen(promise: Promise) {
        bleManager.startScanning {
            for (device in it) {
                sendEvent(context,  Arguments.createMap().apply {
                    putString("event", "new-device")
                    putString("type", device.id)
                    putMap("data", Arguments.createMap().apply {
                        putString("uuid", device.id)
                        putString("name", device.name)
                        putString("service", device.serviceId)
                        putString("rssi", device.rssi.toString())
                    })
                })
            }
        }
        // TODO, I have no way of knowing if the startScanning succeeded
        promise.resolve(1);
    }

    @ReactMethod
    fun stop(promise: Promise) {
        bleManager.stopScanning()
        // TODO, I have no way of knowing if the stopScanning succeeded
        promise.resolve(1);
    }

    @ReactMethod
    fun connect(uuid: String, promise: Promise) {
        bleManager.connect(
            address = uuid,
            onConnectSuccess = {
                promise.resolve(it.id)
            },
            onConnectError = {
                promise.reject("connectError", Exception(it))
            })
    }
    @ReactMethod
    fun onAppStateChange(awake: Boolean) {
        jsAwake = awake // TODO implement the proper event emitter to not emit while in bg
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        // TODO, I have no way of disconnecting
        //bleManager.disconnect()
        promise.resolve(true)
    }

    @ReactMethod
    fun exchange(apdu: String, promise: Promise) {

        bleManager.send(
            apduHex = apdu,
            onSuccess = {
                // TODO, need the response
                // promise.resolve(it)
            },
            onError = {
                promise.reject("exchangeError", Exception(it))
            }
        )
    }

    @ReactMethod
    fun isConnected(promise: Promise) {
        // TODO, I have no way of getting this
        // bleManager.isConnected()
        promise.resolve(false)
    }
}
